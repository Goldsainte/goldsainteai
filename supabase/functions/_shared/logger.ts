/**
 * Structured logging utility for edge functions
 * Provides consistent JSON-formatted logs for better observability
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  userId?: string;
  functionName?: string;
  requestId?: string;
  endpoint?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Create a structured log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error,
  metadata?: Record<string, any>
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  if (context && Object.keys(context).length > 0) {
    entry.context = context;
  }

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (metadata && Object.keys(metadata).length > 0) {
    entry.metadata = metadata;
  }

  return entry;
}

/**
 * Log a debug message
 */
export function logDebug(message: string, context?: LogContext, metadata?: Record<string, any>) {
  const entry = createLogEntry('debug', message, context, undefined, metadata);
  console.log(JSON.stringify(entry));
}

/**
 * Log an info message
 */
export function logInfo(message: string, context?: LogContext, metadata?: Record<string, any>) {
  const entry = createLogEntry('info', message, context, undefined, metadata);
  console.log(JSON.stringify(entry));
}

/**
 * Log a warning
 */
export function logWarn(message: string, context?: LogContext, metadata?: Record<string, any>) {
  const entry = createLogEntry('warn', message, context, undefined, metadata);
  console.warn(JSON.stringify(entry));
}

/**
 * Log an error
 */
export function logError(
  message: string,
  error?: Error,
  context?: LogContext,
  metadata?: Record<string, any>
) {
  const entry = createLogEntry('error', message, context, error, metadata);
  console.error(JSON.stringify(entry));
}

/**
 * Log a fatal error (system-critical)
 */
export function logFatal(
  message: string,
  error?: Error,
  context?: LogContext,
  metadata?: Record<string, any>
) {
  const entry = createLogEntry('fatal', message, context, error, metadata);
  console.error(JSON.stringify(entry));
}

/**
 * Generate a unique request ID for tracing
 */
export function generateRequestId(): string {
  return `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
}

/**
 * Create a logger instance with pre-filled context
 */
export class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  setContext(additionalContext: LogContext) {
    this.context = { ...this.context, ...additionalContext };
  }

  debug(message: string, metadata?: Record<string, any>) {
    logDebug(message, this.context, metadata);
  }

  info(message: string, metadata?: Record<string, any>) {
    logInfo(message, this.context, metadata);
  }

  warn(message: string, metadata?: Record<string, any>) {
    logWarn(message, this.context, metadata);
  }

  error(message: string, error?: Error, metadata?: Record<string, any>) {
    logError(message, error, this.context, metadata);
  }

  fatal(message: string, error?: Error, metadata?: Record<string, any>) {
    logFatal(message, error, this.context, metadata);
  }
}
