/**
 * Centralized rate limiting for API routes.
 * Uses in-memory sliding window counters per IP/key.
 *
 * Also includes admin login brute-force protection.
 */

// ── General API rate limiting ──

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Keep entries for 5 minutes max to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  /** Max requests per window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

// ── Tiered presets ──

/** Read-heavy routes (GET /api/yachts, /api/search, etc.) */
export const READ_RATE_LIMIT: RateLimitOptions = {
  limit: 120,
  windowSeconds: 60,
};

/** Write routes (POST leads, reviews, corrections, etc.) */
export const WRITE_RATE_LIMIT: RateLimitOptions = {
  limit: 20,
  windowSeconds: 60,
};

/** Sensitive write routes — strict (email sharing, compare share) */
export const STRICT_WRITE_RATE_LIMIT: RateLimitOptions = {
  limit: 5,
  windowSeconds: 3600, // 1 hour
};

/** Default rate limit (backward compatible) */
export const DEFAULT_RATE_LIMIT: RateLimitOptions = {
  limit: 100,
  windowSeconds: 60,
};

export function checkRateLimit(
  key: string,
  options: RateLimitOptions = DEFAULT_RATE_LIMIT
): { allowed: boolean; remaining: number; resetAt: number; limit: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetTime) {
    // New window
    const resetAt = now + options.windowSeconds * 1000;
    store.set(key, { count: 1, resetTime: resetAt });
    return { allowed: true, remaining: options.limit - 1, resetAt, limit: options.limit };
  }

  if (entry.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetTime, limit: options.limit };
  }

  entry.count++;
  return { allowed: true, remaining: options.limit - entry.count, resetAt: entry.resetTime, limit: options.limit };
}

export function getClientIp(request: Request | NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return 'unknown';
}

export function rateLimitHeaders(result: { remaining: number; resetAt: number; limit: number }): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    'Cache-Control': 'no-cache',
  };
}

// ── NextRequest type import (for type-only usage) ──
import type { NextRequest } from 'next/server';

// ── Admin login brute-force protection ──
// Uses a separate tracking map with individual attempt timestamps for sliding window.

interface LoginRateLimitEntry {
  attempts: number[];
  lockedUntil: number | null;
}

const loginAttempts = new Map<string, LoginRateLimitEntry>();

/** Max login attempts before lockout */
const MAX_LOGIN_ATTEMPTS = 10;
/** Window for counting attempts (ms) */
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
/** Lockout duration after max attempts (ms) */
const LOCKOUT_MS = 30 * 60 * 1000; // 30 minutes
/** Attempts before showing warnings */
const RATE_LIMIT_THRESHOLD = 5;

/**
 * Check if an IP is rate-limited for login attempts.
 * Returns { allowed, remainingAttempts, retryAfterMs }
 */
export function checkLoginRateLimit(ip: string): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterMs: number;
} {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry) {
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS, retryAfterMs: 0 };
  }

  // Check if locked out
  if (entry.lockedUntil && entry.lockedUntil > now) {
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterMs: entry.lockedUntil - now,
    };
  }

  // Clear expired lockout
  if (entry.lockedUntil && entry.lockedUntil <= now) {
    entry.lockedUntil = null;
    entry.attempts = [];
  }

  // Filter attempts within the window
  entry.attempts = entry.attempts.filter((t) => now - t < LOGIN_WINDOW_MS);

  if (entry.attempts.length >= MAX_LOGIN_ATTEMPTS) {
    // Lock the IP
    entry.lockedUntil = now + LOCKOUT_MS;
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterMs: LOCKOUT_MS,
    };
  }

  return {
    allowed: true,
    remainingAttempts: MAX_LOGIN_ATTEMPTS - entry.attempts.length,
    retryAfterMs: 0,
  };
}

/**
 * Record a failed login attempt for an IP.
 */
export function recordFailedLogin(ip: string): void {
  const now = Date.now();
  let entry = loginAttempts.get(ip);

  if (!entry) {
    entry = { attempts: [], lockedUntil: null };
    loginAttempts.set(ip, entry);
  }

  entry.attempts.push(now);

  // Auto-lockout if threshold reached
  if (entry.attempts.length >= MAX_LOGIN_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS;
  }
}

/**
 * Record a successful login (clears the attempt counter for that IP).
 */
export function recordSuccessfulLogin(ip: string): void {
  loginAttempts.delete(ip);
}

/**
 * Get a delay in ms for exponential backoff based on attempt count.
 */
export function getLoginBackoffDelay(ip: string): number {
  const entry = loginAttempts.get(ip);
  if (!entry) return 0;
  const now = Date.now();
  const recentAttempts = entry.attempts.filter((t) => now - t < LOGIN_WINDOW_MS);
  if (recentAttempts.length < RATE_LIMIT_THRESHOLD) return 0;
  // Exponential backoff: 500ms, 1s, 2s, 4s, etc.
  const excess = recentAttempts.length - RATE_LIMIT_THRESHOLD;
  return Math.min(500 * Math.pow(2, excess), 8000);
}

// Periodic cleanup of stale login rate limit entries (every 10 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      for (const [ip, entry] of loginAttempts.entries()) {
        // Remove old attempts
        entry.attempts = entry.attempts.filter((t) => now - t < LOGIN_WINDOW_MS);
        // Remove entries with no recent activity
        if (entry.attempts.length === 0 && (!entry.lockedUntil || entry.lockedUntil <= now)) {
          loginAttempts.delete(ip);
        }
      }
    },
    10 * 60 * 1000,
  );
}
