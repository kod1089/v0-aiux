import { Redis } from '@upstash/redis'

// Initialize Redis client
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number
  /** Time window in seconds */
  window: number
  /** Identifier prefix for the rate limit key */
  prefix?: string
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

const DEFAULT_CONFIG: RateLimitConfig = {
  limit: 20,
  window: 60, // 1 minute
  prefix: 'ratelimit',
}

/**
 * Rate limiter using Upstash Redis with sliding window algorithm
 */
export async function rateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): Promise<RateLimitResult> {
  const { limit, window, prefix } = { ...DEFAULT_CONFIG, ...config }
  const key = `${prefix}:${identifier}`
  const now = Date.now()
  const windowStart = now - window * 1000

  try {
    // Use a pipeline for atomic operations
    const pipeline = redis.pipeline()
    
    // Remove old entries outside the window
    pipeline.zremrangebyscore(key, 0, windowStart)
    
    // Count current requests in window
    pipeline.zcard(key)
    
    // Add current request
    pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` })
    
    // Set expiration
    pipeline.expire(key, window)
    
    const results = await pipeline.exec()
    
    // Get count before adding (second command result)
    const currentCount = (results[1] as number) || 0
    
    const remaining = Math.max(0, limit - currentCount - 1)
    const reset = Math.ceil((now + window * 1000) / 1000)
    
    return {
      success: currentCount < limit,
      limit,
      remaining,
      reset,
    }
  } catch (error) {
    console.error('[v0] Rate limit error:', error)
    // Fail open - allow request if Redis is unavailable
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Math.ceil((now + window * 1000) / 1000),
    }
  }
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  }
}

/**
 * Create a rate limit response (429 Too Many Requests)
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      retryAfter: result.reset - Math.floor(Date.now() / 1000),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...getRateLimitHeaders(result),
      },
    }
  )
}

/**
 * Different rate limit tiers
 */
export const RATE_LIMITS = {
  // Standard API requests
  api: { limit: 100, window: 60 },
  
  // AI chat requests (more expensive)
  chat: { limit: 20, window: 60 },
  
  // Auth requests (prevent brute force)
  auth: { limit: 5, window: 60 },
  
  // Heavy operations
  heavy: { limit: 10, window: 60 },
} as const
