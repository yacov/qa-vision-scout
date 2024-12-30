type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

interface ErrorContext extends Record<string, unknown> {
  error?: {
    message: string;
    name?: string;
    stack?: string;
    type?: string;
    raw?: unknown;
  };
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = 'info';

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private formatLogMessage(level: LogLevel, message: string, context?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const formattedContext = context ? this.formatContext(context) : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${formattedContext}`;
  }

  private formatContext(context: Record<string, unknown>): string {
    const formattedContext = { ...context };
    if (formattedContext.error && typeof formattedContext.error === 'object') {
      const error = formattedContext.error as { message?: string; type?: string; details?: unknown };
      formattedContext.error = {
        message: error.message || 'Unknown error',
        type: error.type || 'Error',
        details: error.details,
      };
    }
    return ` ${JSON.stringify(formattedContext)}`;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const formattedMessage = this.formatLogMessage(level, message, context);
    switch (level) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.logLevel === 'debug') {
      this.log('debug', message, context);
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.logLevel === 'debug' || this.logLevel === 'info') {
      this.log('info', message, context);
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.logLevel !== 'error') {
      this.log('warn', message, context);
    }
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  }
}

export const logger = Logger.getInstance(); 