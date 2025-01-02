export class BrowserstackError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public requestId: string,
    public context?: any
  ) {
    super(message);
    this.name = 'BrowserstackError';
  }
} 