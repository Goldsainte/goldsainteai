import * as Sentry from '@sentry/react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

import { httpJson, httpRequest } from '@/lib/http/client';

type SessionPayload = {
  session: Session | null;
};

const DEFAULT_ENDPOINT = '/api/auth/session';

// Session sync is only enabled when an explicit endpoint is configured.
// In Lovable/preview (and other static deployments), this will be disabled.
const configuredEndpoint = import.meta.env.VITE_AUTH_SESSION_ENDPOINT;
export const SESSION_SYNC_ENABLED = Boolean(configuredEndpoint);
const sessionEndpoint = configuredEndpoint || DEFAULT_ENDPOINT;

const RETRY_OPTIONS = {
  attempts: 3,
  backoffMs: 400,
  maxBackoffMs: 4000,
  jitterMs: 250,
};

export class SessionSyncError extends Error {
  status?: number;
  cause?: unknown;

  constructor(message: string, status?: number, cause?: unknown) {
    super(message);
    this.name = 'SessionSyncError';
    this.status = status;
    if (cause) {
      this.cause = cause;
    }
  }
}

function sanitizeSession(session: Session | null): Session | null {
  if (!session) return null;

  const { access_token, refresh_token, expires_in, expires_at, token_type, user } = session;

  if (typeof access_token !== 'string' || typeof refresh_token !== 'string') {
    return null;
  }

  return {
    access_token,
    refresh_token,
    expires_in,
    expires_at,
    token_type,
    user,
    provider_refresh_token: session.provider_refresh_token ?? null,
    provider_token: session.provider_token ?? null,
  } as Session;
}

export async function pushSessionToServer(event: AuthChangeEvent, session: Session | null) {
  // No-op if we don't have a real backend endpoint configured
  if (!SESSION_SYNC_ENABLED) {
    return;
  }

  const payload = sanitizeSession(session);

  try {
    const response = await httpRequest(
      sessionEndpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ event, session: payload }),
      },
      {
        retry: RETRY_OPTIONS,
      }
    );

    if (!response.ok) {
      throw new SessionSyncError('Failed to push session to server', response.status);
    }
  } catch (error) {
    Sentry.captureException(error, {
      level: 'warning',
      tags: { scope: 'session_sync', operation: 'push' },
      extra: { event },
    });
    throw error;
  }
}

export async function loadSessionFromServer(): Promise<Session | null> {
  // In environments without a backend session endpoint,
  // just skip server sync and let Supabase client manage the session.
  if (!SESSION_SYNC_ENABLED) {
    return null;
  }

  try {
    const data = await httpJson<SessionPayload>(
      sessionEndpoint,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      },
      {
        retry: RETRY_OPTIONS,
      }
    );

    return sanitizeSession(data?.session ?? null);
  } catch (error) {
    Sentry.captureException(error, {
      level: 'error',
      tags: { scope: 'session_sync', operation: 'load' },
    });
    throw new SessionSyncError('Unable to load session from server', undefined, error);
  }
}
