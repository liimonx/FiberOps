type LogLevel = "debug" | "info" | "warn" | "error";

const isDev = process.env.NODE_ENV === "development";

function emit(level: LogLevel, scope: string, args: unknown[]): void {
  const prefix = `[${scope}]`;

  // Warnings and errors are always surfaced (including production); informational
  // and debug noise is limited to development to keep production consoles clean.
  switch (level) {
    case "error":
      console.error(prefix, ...args);
      break;
    case "warn":
      console.warn(prefix, ...args);
      break;
    case "info":
      if (isDev) console.log(prefix, ...args);
      break;
    case "debug":
      if (isDev) console.debug(prefix, ...args);
      break;
  }
}

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

/**
 * Creates a scoped, environment-aware logger. Prefer this over raw `console.*`
 * so that informational logs are stripped from production builds while warnings
 * and errors continue to surface.
 */
export function createLogger(scope: string): Logger {
  return {
    debug: (...args) => emit("debug", scope, args),
    info: (...args) => emit("info", scope, args),
    warn: (...args) => emit("warn", scope, args),
    error: (...args) => emit("error", scope, args),
  };
}
