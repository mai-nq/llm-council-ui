// Simple in-memory rate limiting for API protection
// For production, consider using Redis-based rate limiting

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  const entry = rateLimitStore.get(key);

  // If no entry or window expired, create new entry
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Increment count and check limit
  entry.count++;
  const allowed = entry.count <= config.maxRequests;

  return {
    allowed,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: entry.resetTime,
  };
}

// Default rate limit configs
export const RATE_LIMITS = {
  // Standard API endpoints: 60 requests per minute
  standard: { maxRequests: 60, windowMs: 60 * 1000 },
  // LLM endpoints (expensive): 10 requests per minute
  llm: { maxRequests: 10, windowMs: 60 * 1000 },
  // Settings: 20 requests per minute
  settings: { maxRequests: 20, windowMs: 60 * 1000 },
} as const;

// Helper to get client IP from request
export function getClientIP(request: Request): string {
  // Check common headers for proxied requests
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback to a default identifier
  return "unknown";
}
