import { logError, logInfo, logWarn, scrubPII } from "@/lib/observability/logger";

type ConsoleArg = unknown;

const originalError = console.error.bind(console);
const originalWarn = console.warn.bind(console);
const originalInfo = console.info.bind(console);

export function installConsoleRedaction() {
  console.error = (...args: ConsoleArg[]) => {
    const [message, ...rest] = args;
    const error = rest.find((arg) => arg instanceof Error) as Error | undefined;
    const context = rest.length ? { args: rest.map((arg) => scrubPII(arg)) } : undefined;
    if (typeof message === "string") {
      logError(message, error, context);
    } else {
      logError("Console error", error, context);
    }
  };

  console.warn = (...args: ConsoleArg[]) => {
    const [message, ...rest] = args;
    const context = rest.length ? { args: rest.map((arg) => scrubPII(arg)) } : undefined;
    if (typeof message === "string") {
      logWarn(message, context);
    } else {
      logWarn("Console warn", context);
    }
  };

  console.info = (...args: ConsoleArg[]) => {
    const [message, ...rest] = args;
    const context = rest.length ? { args: rest.map((arg) => scrubPII(arg)) } : undefined;
    if (typeof message === "string") {
      logInfo(message, context);
    } else {
      logInfo("Console info", context);
    }
  };
}

export function restoreConsole() {
  console.error = originalError;
  console.warn = originalWarn;
  console.info = originalInfo;
}

