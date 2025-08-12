import type { Context } from "@/types"
import type { KyselyDb, Provider, TokenType } from "@incmix-api/utils/db-schema"

import { generateRandomId } from "@/auth/utils"
import { generateSentryHeaders } from "@incmix-api/utils"
import { ServerError } from "@incmix-api/utils/errors"
import { UserRoles } from "@incmix/utils/types"
import { env } from "hono/adapter"
import { TimeSpan, createDate, isWithinExpirationDate } from "oslo"
import { alphabet, generateRandomString } from "oslo/crypto"
import { insertUser } from "./db"

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

  if (!isWithinExpirationDate(new Date(databaseCode.expiresAt))) {
    await c
      .get("db")
      .deleteFrom("verificationCodes")
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
  const { profile, ...newUser } = await insertUser(
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
    .where((eb) =>
      eb.and([
        eb("userId", "=", userId),
        eb("email", "=", email),
        eb("codeType", "=", type),
      ])
    )
    .execute()

  const code = generateRandomString(8, alphabet("0-9", "a-z", "A-Z"))
  await db
    .insertInto("verificationCodes")
    .values({
      userId,
      email,
      expiresAt: createDate(new TimeSpan(7, "d")).toISOString(),
      code,
      codeType: type,
    })
    .execute()

  return code
}

export const sendVerificationEmail = (
  c: Context,
  recipient: string,
  verificationCode: string,
  requestedBy: string
) => {
  const verificationLink = `${env(c).FRONTEND_URL}/email-verification?code=${verificationCode}&email=${recipient}`
  const emailUrl = `${env(c).EMAIL_API_URL}`
  console.log({
    recipient,
    verificationLink,
  })
  const sentryHeaders = generateSentryHeaders(c)
  fetch(emailUrl, {
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
  c: Context,
  recipient: string,
  verificationCode: string,
  requestedBy: string
) => {
  console.log(recipient)
  const emailUrl = env(c).EMAIL_API_URL
  const [username] = recipient.split("@")
  const resetPasswordLink = `${env(c).FRONTEND_URL}/reset-password?code=${verificationCode}&email=${recipient}`

  const sentryHeaders = generateSentryHeaders(c)
  const request = new Request(emailUrl, {
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
  const res = await fetch(request)

  if (!res.ok) throw new ServerError()
  console.log({
    recipient,
    resetPasswordLink,
    verificationCode,
  })
}

export function convertSecondsToHours(seconds: number): string {
  const hours: number = Math.floor(seconds / 3600)
  const minutes: number = Math.floor((seconds % 3600) / 60)
  const remainingSeconds: number = Math.floor(seconds) % 60
  return `${hours} hour(s), ${minutes} minute(s), ${remainingSeconds} second(s)`
}
