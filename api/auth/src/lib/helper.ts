import { randomInt } from "node:crypto"
import { generateSentryHeaders } from "@incmix-api/utils"
import type { KyselyDb, Provider, TokenType } from "@incmix-api/utils/db-schema"
import { ServerError } from "@incmix-api/utils/errors"
import type { Context } from "@incmix-api/utils/types"
import { generateRandomId } from "@/auth/utils"
import { envVars } from "../env-vars"
import { insertUser } from "./db"

// TODO remove ts-ignore and strongly type the eb param
function generateRandomString(length: number): string {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  let out = ""
  for (let i = 0; i < length; i++) {
    out += chars[randomInt(chars.length)]
  }
  return out
}

export async function verifyVerificationCode(
  c: Context,
  user: { id: string; email: string },
  code: string,
  type: TokenType
) {
  const databaseCode = await c
    .get("db")
    .selectFrom("verificationCodes")
    .selectAll()
    // @ts-expect-error
    .where((eb) =>
      eb.and([
        eb("userId", "=", user.id),
        eb("email", "=", user.email),
        eb("code", "=", code),
        eb("codeType", "=", type),
      ])
    )
    .executeTakeFirst()

  if (!databaseCode) {
    return false
  }

  if (new Date(databaseCode.expiresAt) < new Date()) {
    await c
      .get("db")
      .deleteFrom("verificationCodes")
      // @ts-expect-error
      .where((eb) =>
        eb.and([
          eb("userId", "=", user.id),
          eb("code", "=", code),
          eb("codeType", "=", type),
        ])
      )
      .execute()
    return false
  }

  await c
    .get("db")
    .deleteFrom("verificationCodes")
    // @ts-expect-error
    .where((eb) =>
      eb.and([
        eb("userId", "=", user.id),
        eb("code", "=", code),
        eb("codeType", "=", type),
      ])
    )
    .execute()

  return true
}

export async function insertOAuthUser(
  provider: Provider,
  user: { fullName: string; email: string; avatar?: string },
  accountId: string,
  c: Context
) {
  const existingUser = await c
    .get("db")
    .selectFrom("users")
    .selectAll()
    .where("email", "=", user.email)
    .executeTakeFirst()

  const existingAccount = await c
    .get("db")
    .selectFrom("accounts")
    .selectAll()
    // @ts-expect-error
    .where((eb) =>
      eb.and([eb("accountId", "=", accountId), eb("provider", "=", provider)])
    )
    .executeTakeFirst()

  if (existingAccount && existingUser) return existingUser

  if (existingUser && !existingAccount) {
    await c
      .get("db")
      .insertInto("accounts")
      .values({ accountId, provider, userId: existingUser.id })
      .execute()

    return existingUser
  }

  const userId = generateRandomId(15)
  const newUser = await insertUser(
    c,
    {
      id: userId,
      email: user.email,
      isSuperAdmin: false,
      isActive: true,
      hashedPassword: null,
      emailVerifiedAt: new Date().toISOString(),
    },
    user.fullName
  )

  if (!newUser) throw new Error("Failed to insert User")

  await c
    .get("db")
    .insertInto("accounts")
    .values({ accountId, provider, userId: newUser.id })
    .execute()

  return newUser
}

export async function generateVerificationCode(
  c: Context,
  userId: string,
  email: string,
  type: TokenType,
  dbInstance?: KyselyDb
) {
  const db = dbInstance ?? c.get("db")
  await db
    .deleteFrom("verificationCodes")
    // @ts-expect-error
    .where((eb) =>
      eb.and([
        eb("userId", "=", userId),
        eb("email", "=", email),
        eb("codeType", "=", type),
      ])
    )
    .execute()

  const code = generateRandomString(8)
  await db
    .insertInto("verificationCodes")
    .values({
      userId,
      email,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      code,
      codeType: type,
    })
    .execute()

  return code
}

export const sendVerificationEmail = async (
  request: any,
  recipient: string,
  verificationCode: string,
  requestedBy: string
) => {
  const verificationLink = `${envVars.FRONTEND_URL}/email-verification?code=${encodeURIComponent(verificationCode)}&email=${encodeURIComponent(recipient)}`
  const emailUrl = String(envVars.EMAIL_API_URL)

  let sentryHeaders = {}
  try {
    sentryHeaders = generateSentryHeaders({
      get: (key: string) => request.headers[key],
    } as any)
  } catch (_error) {
    // Skip sentry headers if they fail
  }

  await fetch(emailUrl, {
    method: "POST",
    body: JSON.stringify({
      body: {
        payload: { verificationLink },
        template: "VerificationEmail",
      },
      recipient,
      requestedBy,
    }),
    headers: {
      "content-type": "application/json",
      ...sentryHeaders,
    },
  })
}

export const sendForgetPasswordEmail = async (
  request: any,
  recipient: string,
  verificationCode: string,
  requestedBy: string
) => {
  const emailUrl = envVars.EMAIL_API_URL as string
  const [username] = recipient.split("@")
  const resetPasswordLink = `${envVars.FRONTEND_URL}/reset-password?code=${encodeURIComponent(verificationCode)}&email=${encodeURIComponent(recipient)}`

  let sentryHeaders = {}
  try {
    sentryHeaders = generateSentryHeaders({
      get: (key: string) => request.headers[key],
    } as any)
  } catch (_error) {
    // Skip sentry headers if they fail
  }

  const emailRequest = new Request(emailUrl, {
    method: "POST",
    body: JSON.stringify({
      body: {
        payload: { resetPasswordLink, username },
        template: "ResetPasswordEmail",
      },
      requestedBy,
      recipient,
    }),
    headers: {
      "content-type": "application/json",
      ...sentryHeaders,
    },
  })
  const res = await fetch(emailRequest)

  if (!res.ok) throw new ServerError()
}

export function convertSecondsToHours(seconds: number): string {
  const hours: number = Math.floor(seconds / 3600)
  const minutes: number = Math.floor((seconds % 3600) / 60)
  const remainingSeconds: number = Math.floor(seconds) % 60
  return `${hours} hour(s), ${minutes} minute(s), ${remainingSeconds} second(s)`
}
