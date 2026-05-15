import * as Sentry from "@sentry/react";

import { httpJson, httpRequest } from "@/lib/http/client";
import { ensureCSRFToken, getCachedCSRFToken } from "@/lib/security/csrf";

interface HeartbeatResponse {
  ok: boolean;
  nextRecommendedHeartbeatMs?: number;
}

const HEARTBEAT_ENDPOINT = import.meta.env.VITE_PRESENCE_HEARTBEAT_ENDPOINT || "/api/presence/heartbeat";
const STATUS_ENDPOINT = import.meta.env.VITE_PRESENCE_STATUS_ENDPOINT || "/api/presence/status";
const STREAM_ENDPOINT = import.meta.env.VITE_PRESENCE_STREAM_ENDPOINT || "/api/presence/stream";
const TENANT_HEADER = "x-tenant-id";
const DEFAULT_TENANT = import.meta.env.VITE_TENANT_ID || "public";

// Presence sync only runs when an explicit endpoint is configured.
// In Lovable preview / static deployments these endpoints don't exist,
// so we no-op to avoid 404 noise.
export const PRESENCE_ENABLED = Boolean(import.meta.env.VITE_PRESENCE_HEARTBEAT_ENDPOINT);

const RETRY_OPTIONS = {
  attempts: 3,
  backoffMs: 500,
  maxBackoffMs: 6000,
  jitterMs: 300,
};

export type PresenceSnapshot = Record<string, any>;

type PresenceStreamMessage = {
  type: "snapshot" | "upsert" | "delete";
  payload: PresenceSnapshot | PresenceSnapshot[keyof PresenceSnapshot];
};

export async function sendPresenceHeartbeat(status: "online" | "offline") {
  if (!PRESENCE_ENABLED) {
    return { ok: true } as HeartbeatResponse;
  }
  try {
    const response = await httpJson<HeartbeatResponse>(
      HEARTBEAT_ENDPOINT,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          [TENANT_HEADER]: DEFAULT_TENANT,
        },
        body: JSON.stringify({ status }),
      },
      { retry: RETRY_OPTIONS }
    );

    return response;
  } catch (error) {
    Sentry.captureException(error, {
      level: "warning",
      tags: { scope: "presence", operation: "heartbeat" },
    });
    throw error;
  }
}

export async function fetchPresenceSnapshot() {
  if (!PRESENCE_ENABLED) {
    return {} as PresenceSnapshot;
  }
  try {
    return await httpJson<PresenceSnapshot>(
      STATUS_ENDPOINT,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          [TENANT_HEADER]: DEFAULT_TENANT,
        },
      },
      { retry: RETRY_OPTIONS }
    );
  } catch (error) {
    Sentry.captureException(error, {
      level: "warning",
      tags: { scope: "presence", operation: "snapshot" },
    });
    return {};
  }
}

export async function markOffline() {
  if (!PRESENCE_ENABLED) {
    return;
  }
  try {
    const response = await httpRequest(
      HEARTBEAT_ENDPOINT,
      {
        method: "DELETE",
        headers: {
          [TENANT_HEADER]: DEFAULT_TENANT,
        },
      },
      { retry: RETRY_OPTIONS }
    );

    if (!response.ok) {
      throw new Error(`Failed to mark presence offline: ${response.status}`);
    }
  } catch (error) {
    Sentry.captureException(error, {
      level: "warning",
      tags: { scope: "presence", operation: "offline" },
    });
  }
}

export async function subscribeToPresenceStream(
  onMessage: (message: PresenceStreamMessage) => void,
): Promise<() => void> {
  if (!PRESENCE_ENABLED || !STREAM_ENDPOINT) {
    return () => undefined;
  }

  if (typeof window === "undefined" || typeof window.EventSource === "undefined") {
    return () => undefined;
  }

  try {
    await ensureCSRFToken();
    const token = getCachedCSRFToken();
    const url = new URL(STREAM_ENDPOINT, window.location.origin);
    if (token) {
      url.searchParams.set("csrf", token);
    }
    url.searchParams.set("tenant", DEFAULT_TENANT);

    const source = new EventSource(url.toString(), { withCredentials: true });

    source.onmessage = (event: MessageEvent<string>) => {
      try {
        const parsed = JSON.parse(event.data) as PresenceStreamMessage;
        onMessage(parsed);
      } catch (error) {
        Sentry.captureException(error, {
          level: "warning",
          tags: { scope: "presence", operation: "stream_parse" },
        });
      }
    };

    source.onerror = (error) => {
      Sentry.captureException(error, {
        level: "warning",
        tags: { scope: "presence", operation: "stream_error" },
      });
    };

    return () => {
      source.close();
    };
  } catch (error) {
    Sentry.captureException(error, {
      level: "warning",
      tags: { scope: "presence", operation: "stream_bootstrap" },
    });
    return () => undefined;
  }
}
