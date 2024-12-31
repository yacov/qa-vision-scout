export interface RateLimiterOptions {
  maxRetries?: number;
  initialRetryDelay?: number;
  backoffFactor?: number;
}

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillInterval: number;
  private readonly options: Required<RateLimiterOptions>;

  constructor(
    maxTokens: number,
    refillInterval: number,
    options: RateLimiterOptions = {}
  ) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
    this.refillInterval = refillInterval;
    this.options = {
      maxRetries: options.maxRetries ?? 3,
      initialRetryDelay: options.initialRetryDelay ?? 1000,
      backoffFactor: options.backoffFactor ?? 2
    };
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.floor(timePassed / this.refillInterval) * this.maxTokens;
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  async acquireToken(): Promise<void> {
    let attempts = 0;
    let delay = this.options.initialRetryDelay;

    while (attempts < this.options.maxRetries) {
      this.refillTokens();

      if (this.tokens > 0) {
        this.tokens--;
        return;
      }

      attempts++;
      if (attempts < this.options.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= this.options.backoffFactor;
      }
    }

    throw new Error('Rate limit exceeded');
  }
} 