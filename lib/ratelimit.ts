import { Duration } from './duration'
import { db } from './db'
import { rateLimits } from './db/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export default async function ratelimit(
  key: string | null,
  maxRequests: number,
  window: Duration,
) {
  if (!key) {
    return undefined
  }

  const identifier = `ratelimit_${key}`
  const now = new Date()
  const windowMs = typeof window === 'string' ? parseDuration(window) : window

  const existing = await db
    .select()
    .from(rateLimits)
    .where(eq(rateLimits.identifier, identifier))
    .limit(1)

  if (existing.length > 0) {
    const record = existing[0]
    const resetAt = new Date(record.resetAt)

    if (now < resetAt) {
      if (record.count >= maxRequests) {
        return {
          amount: maxRequests,
          reset: resetAt.getTime(),
          remaining: 0,
        }
      }

      await db
        .update(rateLimits)
        .set({
          count: record.count + 1,
          updatedAt: now,
        })
        .where(eq(rateLimits.identifier, identifier))

      return undefined
    } else {
      await db
        .update(rateLimits)
        .set({
          count: 1,
          resetAt: new Date(now.getTime() + windowMs),
          updatedAt: now,
        })
        .where(eq(rateLimits.identifier, identifier))

      return undefined
    }
  } else {
    await db.insert(rateLimits).values({
      id: nanoid(),
      identifier,
      count: 1,
      resetAt: new Date(now.getTime() + windowMs),
      createdAt: now,
      updatedAt: now,
    })

    return undefined
  }
}

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)\s*(ms|s|m|h|d)$/)
  if (!match) return 60000 // default to 1 minute

  const value = parseInt(match[1])
  const unit = match[2]

  switch (unit) {
    case 'ms':
      return value
    case 's':
      return value * 1000
    case 'm':
      return value * 60 * 1000
    case 'h':
      return value * 60 * 60 * 1000
    case 'd':
      return value * 24 * 60 * 60 * 1000
    default:
      return 60000
  }
}
