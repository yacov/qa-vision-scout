export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly refillRate: number;
  private readonly maxTokens: number;

  constructor(maxTokens: number = 5, refillRate: number = 1000) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
    this.refillRate = refillRate;
    this.maxTokens = maxTokens;
  }

  private refill() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.floor(timePassed / this.refillRate);
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  async acquireToken(): Promise<void> {
    this.refill();
    
    if (this.tokens > 0) {
      this.tokens--;
      return Promise.resolve();
    }
    
    return new Promise((resolve) => {
      const waitTime = this.refillRate - (Date.now() - this.lastRefill);
      setTimeout(() => {
        this.refill();
        this.tokens--;
        resolve();
      }, waitTime);
    });
  }
} 