interface LogContext {
  message: string;
  error?: unknown;
  requestId?: string;
  [key: string]: unknown;
}

function formatError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error as any),  // Include any additional properties
    };
  }
  return { error };
}

export class Logger {
  error(context: LogContext): void {
    const formattedContext = {
      ...context,
      error: context.error ? formatError(context.error) : undefined,
      timestamp: new Date().toISOString(),
    };
    console.error(JSON.stringify(formattedContext, null, 2));
  }

  info(context: LogContext): void {
    console.info(JSON.stringify({ ...context, timestamp: new Date().toISOString() }, null, 2));
  }

  warn(context: LogContext): void {
    console.warn(JSON.stringify({ ...context, timestamp: new Date().toISOString() }, null, 2));
  }

  debug(context: LogContext): void {
    console.debug(JSON.stringify({ ...context, timestamp: new Date().toISOString() }, null, 2));
  }
}

export const logger = new Logger();