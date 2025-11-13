import { createServer as createHttpServer } from "node:http";
import { before, after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";

import { createApp, resetServerState } from "../../../server/app.js";

const buildSessionPayload = () => ({
  access_token: "access-token-sample",
  refresh_token: "refresh-token-sample",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: "bearer",
  user: {
    id: "user-123",
    email: "user@example.com",
  },
});

let server;
let baseUrl;

before(async () => {
  const handler = createApp();
  server = createHttpServer(handler);
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (address && typeof address === "object") {
    baseUrl = `http://127.0.0.1:${address.port}`;
  } else {
    throw new Error("Unable to determine server address");
  }
});

after(async () => {
  await new Promise((resolve) => server?.close(resolve));
});

beforeEach(() => {
  resetServerState();
});

test("issues CSRF tokens and rejects requests without them", async () => {
  const csrfResponse = await fetch(`${baseUrl}/api/csrf-token`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  assert.equal(csrfResponse.status, 200);
  const { token } = await csrfResponse.json();
  assert.equal(typeof token, "string");
  const cookie = csrfResponse.headers.get("set-cookie");
  assert.ok(cookie);

  const rejected = await fetch(`${baseUrl}/api/auth/session`, {
    method: "GET",
    headers: { cookie: cookie ?? "" },
  });
  assert.equal(rejected.status, 419);

  const accepted = await fetch(`${baseUrl}/api/auth/session`, {
    method: "GET",
    headers: {
      cookie: cookie ?? "",
      "x-csrf-token": token,
    },
  });
  assert.equal(accepted.status, 200);
  const payload = await accepted.json();
  assert.deepEqual(payload, { session: null });
});

test("stores sanitized sessions and exposes presence controls", async () => {
  const csrfResponse = await fetch(`${baseUrl}/api/csrf-token`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const { token } = await csrfResponse.json();
  const cookie = csrfResponse.headers.get("set-cookie") ?? "";

  const postSession = await fetch(`${baseUrl}/api/auth/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": token,
      cookie,
    },
    body: JSON.stringify({ event: "SIGNED_IN", session: buildSessionPayload() }),
  });
  assert.equal(postSession.status, 204);

  const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
    method: "GET",
    headers: {
      "x-csrf-token": token,
      cookie,
    },
  });
  assert.equal(sessionResponse.status, 200);
  const sessionBody = await sessionResponse.json();
  assert.equal(sessionBody.session.access_token, "access-token-sample");
  assert.equal(sessionBody.session.refresh_token, "refresh-token-sample");
  assert.equal(sessionBody.session.user.id, "user-123");

  const heartbeatResponse = await fetch(`${baseUrl}/api/presence/heartbeat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": token,
      cookie,
    },
    body: JSON.stringify({ status: "online", metadata: { shard: "feed" } }),
  });
  assert.equal(heartbeatResponse.status, 200);

  const snapshot = await fetch(`${baseUrl}/api/presence/status`, {
    method: "GET",
    headers: {
      "x-csrf-token": token,
      cookie,
    },
  });
  assert.equal(snapshot.status, 200);
  const snapshotBody = await snapshot.json();
  assert.equal(snapshotBody["user-123"].status, "online");
});

