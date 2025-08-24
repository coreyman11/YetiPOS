/**
 * Client-side rate limiting utilities
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

class ClientRateLimiter {
  private store = new Map<string, RequestRecord>();
  private configs = new Map<string, RateLimitConfig>();

  /**
   * Configure rate limiting for a specific endpoint
   */
  configure(endpoint: string, config: RateLimitConfig): void {
    this.configs.set(endpoint, config);
  }

  /**
   * Check if a request to an endpoint is allowed
   */
  isAllowed(endpoint: string): boolean {
    const config = this.configs.get(endpoint);
    if (!config) {
      return true; // No rate limiting configured
    }

    const now = Date.now();
    const record = this.store.get(endpoint);

    if (!record) {
      this.store.set(endpoint, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return true;
    }

    // Reset if window has passed
    if (now >= record.resetTime) {
      this.store.set(endpoint, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return true;
    }

    // Check if limit exceeded
    if (record.count >= config.maxRequests) {
      return false;
    }

    // Increment count
    record.count++;
    return true;
  }

  /**
   * Get time until rate limit resets
   */
  getResetTime(endpoint: string): number {
    const record = this.store.get(endpoint);
    if (!record) {
      return 0;
    }
    return Math.max(0, record.resetTime - Date.now());
  }
}

// Export singleton instance
export const rateLimiter = new ClientRateLimiter();

// Configure rate limits for public endpoints
rateLimiter.configure('stripe-checkout', {
  maxRequests: 5,
  windowMs: 60 * 1000 // 5 requests per minute
});

rateLimiter.configure('stripe-publishable-key', {
  maxRequests: 10,
  windowMs: 60 * 1000 // 10 requests per minute
});

/**
 * Rate limiting error
 */
export class RateLimitError extends Error {
  constructor(public resetTime: number) {
    super('Too many requests. Please try again later.');
    this.name = 'RateLimitError';
  }
}

/**
 * Utility to check rate limit before making a request
 */
export const checkRateLimit = (endpoint: string): void => {
  if (!rateLimiter.isAllowed(endpoint)) {
    const resetTime = rateLimiter.getResetTime(endpoint);
    throw new RateLimitError(resetTime);
  }
};