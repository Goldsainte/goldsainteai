import { createServer as createHttpServer } from "node:http";
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { URL } from "node:url";
import { loadConfig } from "./config.js";

// Load and validate config at startup (fail-fast)
const config = loadConfig();

const SESSION_COOKIE = "gs_session";
const CSRF_HEADER = "x-csrf-token";
const CSRF_QUERY_KEY = "csrf";
const TENANT_HEADER = "x-tenant-id";
const HEARTBEAT_INTERVAL_MS = 30_000;
const PRESENCE_TTL_MS = 120_000;

const sessionStore = new Map();
const csrfStore = new Map();
const presenceStore = new Map();
const presenceStreams = new Map();

// 🔒 Rate limiting stores
const rateBuckets = new Map();
const RATE_LIMITS = {
  "/api/presence/heartbeat": { max: 60, windowMs: 60_000 }, // 60 req/min
  "/api/csrf-token": { max: 30, windowMs: 60_000 },
  "/api/auth/session": { max: 30, windowMs: 60_000 },
};

function checkNodeRateLimit(req, pathname) {
  const cfg = RATE_LIMITS[pathname];
  if (!cfg) return null;

  const forwarded = req.headers["x-forwarded-for"];
  const realIp = req.headers["x-real-ip"];
  const ip = (forwarded?.split(",")[0] ?? "").trim() || realIp || "unknown";

  const key = `${pathname}:${ip}`;
  const now = Date.now();
  const bucket = rateBuckets.get(key) || {
    count: 0,
    reset: now + cfg.windowMs,
  };

  if (now > bucket.reset) {
    bucket.count = 0;
    bucket.reset = now + cfg.windowMs;
  }

  bucket.count += 1;
  rateBuckets.set(key, bucket);

  if (bucket.count > cfg.max) {
    return {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": Math.ceil((bucket.reset - now) / 1000).toString(),
      },
      body: JSON.stringify({ error: "rate_limit_exceeded" }),
    };
  }

  return null;
}

function serverLog(level, message, context) {
  const payload = { level, message, context, timestamp: new Date().toISOString() };
  // eslint-disable-next-line no-console
  console[level === "error" ? "error" : level === "warn" ? "warn" : "info"](`[server] ${message}`, payload);
}

function serializePresenceSnapshot(map) {
  const snapshot = {};
  for (const [userId, entry] of map.entries()) {
    snapshot[userId] = {
      user_id: userId,
      status: entry.status,
      metadata: entry.metadata,
      lastSeen: entry.lastSeen,
    };
  }
  return snapshot;
}

const getSecret = () => process.env.CSRF_SECRET || "development-csrf-secret";

function createDigest(sessionId, token) {
  return createHmac("sha256", getSecret()).update(`${sessionId}:${token}`).digest("hex");
}

function sanitizeSessionPayload(session) {
  if (!session) return null;
  const { access_token, refresh_token, expires_in, expires_at, token_type, user } = session;
  if (typeof access_token !== "string" || typeof refresh_token !== "string") {
    return null;
  }
  return {
    access_token,
    refresh_token,
    expires_in,
    expires_at,
    token_type,
    provider_refresh_token: session.provider_refresh_token ?? null,
    provider_token: session.provider_token ?? null,
    user,
  };
}

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  header.split(";").forEach((chunk) => {
    const [key, ...rest] = chunk.trim().split("=");
    if (!key) return;
    cookies[key] = rest.join("=");
  });
  return cookies;
}

function setCookie(res, name, value, options = {}) {
  const parts = [`${name}=${value}`];
  parts.push(`Path=${options.path || "/"}`);
  parts.push(`Max-Age=${options.maxAge ?? 60 * 60 * 24 * 30}`);
  parts.push(`SameSite=${options.sameSite || "Lax"}`);
  if (options.httpOnly !== false) parts.push("HttpOnly");
  if (options.secure ?? process.env.NODE_ENV === "production") parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

function ensureSession(req, res) {
  const cookies = parseCookies(req.headers.cookie || "");
  let sessionId = cookies[SESSION_COOKIE];
  if (!sessionId || !sessionStore.has(sessionId)) {
    sessionId = randomUUID();
    sessionStore.set(sessionId, { createdAt: Date.now(), session: null });
    setCookie(res, SESSION_COOKIE, sessionId, { httpOnly: true, secure: process.env.NODE_ENV === "production" });
  }
  return sessionId;
}

function issueCsrfToken(sessionId) {
  const token = randomBytes(32).toString("base64url");
  const digest = createDigest(sessionId, token);
  csrfStore.set(sessionId, { digest, expiresAt: Date.now() + 15 * 60 * 1000 });
  return token;
}

function validateCsrf(sessionId, token) {
  if (!token) return false;
  const stored = csrfStore.get(sessionId);
  if (!stored) return false;
  if (Date.now() > stored.expiresAt) {
    csrfStore.delete(sessionId);
    return false;
  }
  const digest = createDigest(sessionId, token);
  return timingSafeEqual(Buffer.from(digest), Buffer.from(stored.digest));
}

function getTenantId(req, url) {
  const headerTenant = req.headers[TENANT_HEADER];
  if (typeof headerTenant === "string" && headerTenant.trim()) {
    return headerTenant.trim().toLowerCase();
  }
  const tenantParam = url.searchParams.get("tenant");
  return tenantParam ? tenantParam.toLowerCase() : "default";
}

function getPresenceMap(tenantId) {
  if (!presenceStore.has(tenantId)) {
    presenceStore.set(tenantId, new Map());
  }
  return presenceStore.get(tenantId);
}

function getStreamSet(tenantId) {
  if (!presenceStreams.has(tenantId)) {
    presenceStreams.set(tenantId, new Set());
  }
  return presenceStreams.get(tenantId);
}

function broadcastPresence(tenantId, message) {
  const streams = getStreamSet(tenantId);
  const payload = `data: ${JSON.stringify(message)}\n\n`;
  for (const stream of streams) {
    try {
      stream.write(payload);
    } catch (error) {
      streams.delete(stream);
    }
  }
}

function prunePresence() {
  const now = Date.now();
  for (const [tenantId, members] of presenceStore.entries()) {
    for (const [userId, entry] of members.entries()) {
      if (now - entry.lastSeen > PRESENCE_TTL_MS) {
        members.delete(userId);
        broadcastPresence(tenantId, { type: "delete", payload: { user_id: userId } });
      }
    }
  }
}

setInterval(prunePresence, HEARTBEAT_INTERVAL_MS).unref?.();

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (chunks.length === 0) {
    return null;
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch (error) {
    return null;
  }
}

function sendJson(res, status, body, headers = {}) {
  const responseBody = body === undefined ? null : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": headers.origin || "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "content-type, x-csrf-token, x-tenant-id",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    ...headers.custom,
  });
  if (responseBody !== null) {
    res.end(responseBody);
  } else {
    res.end();
  }
}

function checkCsrf(req, res, sessionId, url) {
  const token = req.headers[CSRF_HEADER] || req.headers["x-xsrf-token"] || url.searchParams.get(CSRF_QUERY_KEY);
  if (!validateCsrf(sessionId, typeof token === "string" ? token : null)) {
    sendJson(res, 419, { error: "Invalid or expired CSRF token" });
    return false;
  }
  return true;
}

function buildHandler() {
  return async (req, res) => {
    const url = new URL(req.url || "/", "http://localhost");
    const origin = req.headers.origin || "*";

    if (req.method === "OPTIONS") {
      sendJson(res, 204, null, { origin });
      return;
    }

    try {
      const sessionId = ensureSession(req, res);

      if (req.method === "GET" && url.pathname === "/healthz") {
        sendJson(res, 200, { status: "ok", sessions: sessionStore.size, presenceTenants: presenceStore.size }, { origin });
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/csrf-token") {
        const existing = csrfStore.get(sessionId);
        if (existing && existing.expiresAt > Date.now() + 60_000) {
          sendJson(res, 200, { token: null, reused: true, expiresAt: existing.expiresAt }, { origin });
          return;
        }
        const token = issueCsrfToken(sessionId);
        sendJson(res, 200, { token, expiresAt: Date.now() + 15 * 60 * 1000 }, { origin });
        return;
      }

      if (url.pathname.startsWith("/api/")) {
        if (!checkCsrf(req, res, sessionId, url)) {
          return;
        }
      }

      if (req.method === "GET" && url.pathname === "/api/auth/session") {
        const entry = sessionStore.get(sessionId);
        sendJson(res, 200, { session: sanitizeSessionPayload(entry?.session) }, { origin });
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/auth/session") {
        const body = (await readJsonBody(req)) || {};
        if (!body.event) {
          sendJson(res, 400, { error: "Missing event" }, { origin });
          return;
        }
        const sanitized = sanitizeSessionPayload(body.session);
        const entry = sessionStore.get(sessionId) ?? { createdAt: Date.now(), session: null };
        entry.session = sanitized;
        entry.updatedAt = Date.now();
        sessionStore.set(sessionId, entry);
        sendJson(res, 204, null, { origin });
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/presence/heartbeat") {
        const entry = sessionStore.get(sessionId);
        const userId = entry?.session?.user?.id;
        if (!userId) {
          sendJson(res, 401, { error: "Authenticated user required" }, { origin });
          return;
        }
        const body = (await readJsonBody(req)) || {};
        const tenantId = getTenantId(req, url);
        const members = getPresenceMap(tenantId);
        const snapshotEntry = {
          user_id: userId,
          status: body.status === "offline" ? "offline" : "online",
          metadata: body.metadata ?? {},
          lastSeen: Date.now(),
        };
        members.set(userId, snapshotEntry);
        broadcastPresence(tenantId, { type: "upsert", payload: snapshotEntry });
        sendJson(res, 200, { ok: true, nextRecommendedHeartbeatMs: HEARTBEAT_INTERVAL_MS }, { origin });
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/presence/status") {
        const tenantId = getTenantId(req, url);
        const members = getPresenceMap(tenantId);
        sendJson(res, 200, serializePresenceSnapshot(members), { origin });
        return;
      }

      if (req.method === "DELETE" && url.pathname === "/api/presence/heartbeat") {
        const entry = sessionStore.get(sessionId);
        const userId = entry?.session?.user?.id;
        const tenantId = getTenantId(req, url);
        const members = getPresenceMap(tenantId);
        if (userId && members.delete(userId)) {
          broadcastPresence(tenantId, { type: "delete", payload: { user_id: userId } });
        }
        sendJson(res, 204, null, { origin });
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/presence/stream") {
        const tenantId = getTenantId(req, url);
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
        });
        const members = getPresenceMap(tenantId);
        res.write(`data: ${JSON.stringify({ type: "snapshot", payload: serializePresenceSnapshot(members) })}\n\n`);
        const streams = getStreamSet(tenantId);
        streams.add(res);
        req.on("close", () => {
          streams.delete(res);
        });
        return;
      }

      sendJson(res, 404, { error: "Not found" }, { origin });
    } catch (error) {
      const correlationId = randomUUID();
      serverLog("error", "Request handling failed", { correlationId, error: error?.message });
      sendJson(res, 500, { error: "Internal server error", correlationId }, { origin });
    }
  };
}

export function createApp() {
  return buildHandler();
}

export function createServer() {
  const handler = buildHandler();
  const server = createHttpServer(handler);
  const port = Number(process.env.PORT || 4100);
  server.listen(port, () => {
    serverLog("info", `API server listening on port ${port}`);
  });
  return { app: server, server };
}

export function resetServerState() {
  sessionStore.clear();
  csrfStore.clear();
  presenceStore.clear();
  for (const streams of presenceStreams.values()) {
    for (const stream of streams) {
      try {
        stream.end();
      } catch (error) {
        // ignore cleanup errors
      }
    }
  }
  presenceStreams.clear();
}

export const __stores = {
  sessionStore,
  csrfStore,
  presenceStore,
  presenceStreams,
};

