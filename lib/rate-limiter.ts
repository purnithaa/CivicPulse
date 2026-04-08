/**
 * Client-side rate limiter using localStorage.
 * Limits how many times a user can perform an action within a time window.
 */

interface RateLimitRecord {
  timestamps: number[]
}

const RATE_LIMIT_KEY_PREFIX = "civicpulse_rl_"

/**
 * Check if an action is allowed and record it if so.
 * @param actionKey - Unique key for the action (e.g. "report_submit")
 * @param userId - User identifier (email or phone)
 * @param maxCount - Max allowed actions in the window
 * @param windowMs - Time window in milliseconds
 * @returns { allowed: boolean, remainingMs: number, remaining: number }
 */
export function checkRateLimit(
  actionKey: string,
  userId: string,
  maxCount: number = 5,
  windowMs: number = 60 * 60 * 1000 // 1 hour
): { allowed: boolean; remainingMs: number; remaining: number } {
  if (typeof window === "undefined") return { allowed: true, remainingMs: 0, remaining: maxCount }

  const storageKey = `${RATE_LIMIT_KEY_PREFIX}${actionKey}_${userId}`
  const now = Date.now()

  let record: RateLimitRecord = { timestamps: [] }
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) record = JSON.parse(raw)
  } catch {}

  // Remove timestamps outside the window
  record.timestamps = record.timestamps.filter((t) => now - t < windowMs)

  if (record.timestamps.length >= maxCount) {
    const oldestInWindow = record.timestamps[0]
    const remainingMs = windowMs - (now - oldestInWindow)
    return { allowed: false, remainingMs, remaining: 0 }
  }

  // Record this action
  record.timestamps.push(now)
  try {
    localStorage.setItem(storageKey, JSON.stringify(record))
  } catch {}

  return {
    allowed: true,
    remainingMs: 0,
    remaining: maxCount - record.timestamps.length,
  }
}

/**
 * Format milliseconds as human-readable string
 */
export function formatRemainingTime(ms: number): string {
  const mins = Math.ceil(ms / 60000)
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""}`
  const hrs = Math.ceil(ms / 3600000)
  return `${hrs} hour${hrs !== 1 ? "s" : ""}`
}
