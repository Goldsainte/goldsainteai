import * as Sentry from "@sentry/react";
import { ensureCSRFToken, getCSRFHeaders, refreshCSRFToken } from "@/lib/security/csrf";

interface RetryOptions {
  attempts?: number;
  backoffMs?: number;
  maxBackoffMs?: number;
  jitterMs?: number;
  statusCodes?: number[];
}

interface RequestOptions {
  attachCSRF?: boolean;
  retry?: RetryOptions;
  onRetry?: (attempt: number, response?: Response, error?: unknown) => void;
}

const DEFAULT_RETRY_STATUS = [408, 409, 425, 429, 500, 502, 503, 504, 522, 524, 598, 599, 419];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function buildRetryDelay(attempt: number, options: RetryOptions): number {
  const base = options.backoffMs ?? 300;
  const max = options.maxBackoffMs ?? 5000;
  const jitter = options.jitterMs ?? 200;
  const delay = Math.min(base * 2 ** (attempt - 1), max);
  const jitterOffset = Math.random() * jitter;
  return delay + jitterOffset;
}

async function withCSRFHeaders(init: RequestInit = {}): Promise<RequestInit> {
  await ensureCSRFToken();
  const csrfHeaders = getCSRFHeaders();
  return {
    ...init,
    headers: {
      ...(init.headers instanceof Headers ? Object.fromEntries(init.headers.entries()) : init.headers ?? {}),
      ...csrfHeaders,
    },
  };
}

export async function httpRequest(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: RequestOptions = {}
): Promise<Response> {
  const {
    attachCSRF = true,
    retry: retryOptions = {},
    onRetry,
  } = options;

  const {
    attempts = 3,
    statusCodes = DEFAULT_RETRY_STATUS,
  } = retryOptions;

  let preparedInit = init;
  if (attachCSRF) {
    preparedInit = await withCSRFHeaders(init);
  }

  preparedInit = {
    credentials: "include",
    ...preparedInit,
  };

  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(input, preparedInit);

      if (response.status === 419 && attachCSRF) {
        await refreshCSRFToken();
        if (attempt === attempts) {
          return response;
        }
        onRetry?.(attempt, response);
        continue;
      }

      if (!response.ok && statusCodes.includes(response.status) && attempt < attempts) {
        onRetry?.(attempt, response);
        const delay = buildRetryDelay(attempt, retryOptions);
        await sleep(delay);
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
      if (attempt === attempts) {
        break;
      }
      onRetry?.(attempt, undefined, error);
      const delay = buildRetryDelay(attempt, retryOptions);
      await sleep(delay);
    }
  }

  Sentry.captureException(lastError ?? new Error("httpRequest failed"), {
    level: "error",
    tags: { component: "httpRequest" },
    extra: {
      input: typeof input === "string" ? input : input.toString(),
    },
  });

  throw lastError ?? new Error("Request failed without response");
}

export async function httpJson<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: RequestOptions = {}
): Promise<T> {
  const response = await httpRequest(input, init, options);

  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}`);
    Sentry.captureException(error, {
      level: "warning",
      tags: { component: "httpJson", status: String(response.status) },
      extra: { url: typeof input === "string" ? input : input.toString() },
    });
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
