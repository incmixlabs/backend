import type { KyselyDb, NewSession } from "@incmix-api/utils/db-schema"
import type { Session } from "@incmix-api/utils/types"
import { generateSessionId } from "./utils"

const SESSION_EXPIRY_DAYS = 30

function getExpiryDate(): Date {
  const expires = new Date()
  expires.setDate(expires.getDate() + SESSION_EXPIRY_DAYS)
  return expires
}

export async function createSession(
  db: KyselyDb,
  userId: string
): Promise<Session> {
  const id = generateSessionId()
  const expiresAt = getExpiryDate()
  const now = new Date()
  const newSession: NewSession = {
    id,
    userId,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }
  await db.insertInto("sessions").values(newSession).execute()
  return { id, userId, expiresAt: expiresAt.toISOString(), fresh: true }
}

export async function validateSession(
  db: KyselyDb,
  sessionId: string
): Promise<Session | null> {
  const row = await db
    .selectFrom("sessions")
    .select(["id", "userId", "expiresAt"])
    .where("id", "=", sessionId)
    .executeTakeFirst()
  if (!row) return null
  const now = new Date()
  const expiresAt = new Date(row.expiresAt)
  if (expiresAt < now) {
    await invalidateSession(db, sessionId)
    return null
  }
  // Automatic renewal if halfway to expiration
  const createdAt = new Date(
    expiresAt.getTime() - SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  )
  const fresh = false
  if (
    now.getTime() - createdAt.getTime() >
    (SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000) / 2
  ) {
    const newExpiresAt = getExpiryDate()
    await db
      .updateTable("sessions")
      .set({
        expiresAt: newExpiresAt.toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where("id", "=", sessionId)
      .execute()
    return {
      id: row.id,
      userId: row.userId,
      expiresAt: newExpiresAt.toISOString(),
      fresh: true,
    }
  }
  return {
    id: row.id,
    userId: row.userId,
    expiresAt: row.expiresAt.toISOString(),
    fresh,
  }
}

export async function invalidateSession(
  db: KyselyDb,
  sessionId: string
): Promise<void> {
  await db.deleteFrom("sessions").where("id", "=", sessionId).execute()
}

export async function invalidateAllSessions(
  db: KyselyDb,
  userId: string
): Promise<void> {
  await db.deleteFrom("sessions").where("userId", "=", userId).execute()
}
