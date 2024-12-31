interface LogContext {
  message: string;
  [key: string]: unknown;
}

function formatError(error: Error): unknown {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error as any),
    };
  }
  return { error };
}

class Logger {
  error(context: LogContext & { error?: unknown }): void {
    const formattedContext = {
      ...context,
      error: context.error ? formatError(context.error as Error) : undefined,
      timestamp: new Date().toISOString(),
      level: 'error'
    };
    console.error(JSON.stringify(formattedContext, null, 2));
  }

  info(context: LogContext): void {
    console.info(JSON.stringify({ 
      ...context, 
      timestamp: new Date().toISOString(),
      level: 'info'
    }, null, 2));
  }

  warn(context: LogContext): void {
    console.warn(JSON.stringify({ 
      ...context, 
      timestamp: new Date().toISOString(),
      level: 'warn'
    }, null, 2));
  }

  debug(context: LogContext): void {
    console.debug(JSON.stringify({ 
      ...context, 
      timestamp: new Date().toISOString(),
      level: 'debug'
    }, null, 2));
  }
}

export const logger = new Logger();