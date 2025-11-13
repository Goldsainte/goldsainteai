import * as Sentry from "@sentry/react";

type LogLevel = "info" | "warn" | "error";

type LogContext = Record<string, unknown> | undefined;

const originalError = console.error.bind(console);
const originalWarn = console.warn.bind(console);
const originalInfo = console.info.bind(console);

const REDACT_KEYS = new Set([
  "access_token",
  "refresh_token",
  "authorization",
  "password",
  "email",
  "phone",
  "token",
  "secret",
]);

function scrubValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    if (value.length > 80) {
      return `${value.slice(0, 10)}…[redacted]`;
    }
    return value.replace(/[A-Za-z0-9+/=]{16,}/g, "[redacted]");
  }
  if (Array.isArray(value)) {
    return value.map((item) => scrubValue(item));
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => {
      if (REDACT_KEYS.has(key.toLowerCase())) {
        return [key, "[redacted]"];
      }
      return [key, scrubValue(nestedValue)];
    });
    return Object.fromEntries(entries);
  }
  return value;
}

function emit(level: LogLevel, message: string, context?: LogContext, error?: unknown) {
  const payload: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    message,
    level,
  };
  if (context) {
    payload.context = scrubValue(context);
  }
  if (error instanceof Error) {
    payload.error = {
      name: error.name,
      message: error.message,
      stack: import.meta.env.DEV ? error.stack : undefined,
    };
  }
  const method = level === "error" ? originalError : level === "warn" ? originalWarn : originalInfo;
  method(`[${level.toUpperCase()}] ${message}`, payload);
}

export function logError(message: string, error?: unknown, context?: LogContext) {
  emit("error", message, context, error);
  if (error instanceof Error) {
    Sentry.captureException(error, {
      level: "error",
      tags: context && "tags" in context ? (context.tags as Record<string, string>) : undefined,
      extra: scrubValue(context ?? {}),
    });
  } else if (context) {
    Sentry.captureMessage(message, {
      level: "error",
      extra: scrubValue(context),
    });
  }
}

export function logWarn(message: string, context?: LogContext) {
  emit("warn", message, context);
  Sentry.captureMessage(message, {
    level: "warning",
    extra: scrubValue(context ?? {}),
  });
}

export function logInfo(message: string, context?: LogContext) {
  emit("info", message, context);
}

export function scrubPII<T>(value: T): T {
  return scrubValue(value) as T;
}

