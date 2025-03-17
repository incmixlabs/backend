import type { Provider, TokenType } from "@/dbSchema"
import type { Context } from "@/types"

import { envVars } from "@/env-vars"
import { generateSentryHeaders } from "@incmix-api/utils"
import { ServerError } from "@incmix-api/utils/errors"
import { generateId } from "lucia"
import { TimeSpan, createDate, isWithinExpirationDate } from "oslo"
import { alphabet, generateRandomString } from "oslo/crypto"
import { db, insertUser } from "./db"
export async function verifyVerificationCode(
  user: { id: string; email: string },
  code: string,
  type: TokenType
) {
  const databaseCode = await db
    .selectFrom("verificationCodes")
    .selectAll()
    .where((eb) =>
      eb.and([
        eb("userId", "=", user.id),
        eb("email", "=", user.email),
        eb("code", "=", code),
        eb("description", "=", type),
      ])
    )
    .executeTakeFirst()

  if (!databaseCode) {
    return false
  }

  if (!isWithinExpirationDate(new Date(databaseCode.expiresAt))) {
    await db
      .deleteFrom("verificationCodes")
      .where((eb) =>
        eb.and([
          eb("userId", "=", user.id),
          eb("code", "=", code),
          eb("description", "=", type),
        ])
      )
      .execute()
    return false
  }

  await db
    .deleteFrom("verificationCodes")
    .where((eb) =>
      eb.and([
        eb("userId", "=", user.id),
        eb("code", "=", code),
        eb("description", "=", type),
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
  const existingUser = await db
    .selectFrom("users")
    .selectAll()
    .where("email", "=", user.email)
    .executeTakeFirst()

  const existingAccount = await db
    .selectFrom("accounts")
    .selectAll()
    .where((eb) =>
      eb.and([eb("accountId", "=", accountId), eb("provider", "=", provider)])
    )
    .executeTakeFirst()

  if (existingAccount && existingUser) return existingUser

  if (existingUser && !existingAccount) {
    await db
      .insertInto("accounts")
      .values({ accountId, provider, userId: existingUser.id })
      .execute()

    return existingUser
  }

  const userId = generateId(15)
  const { profile, ...newUser } = await insertUser(
    c,
    {
      id: userId,
      email: user.email,
      emailVerified: true,
      userType: "member",
      isActive: false,
      hashedPassword: null,
    },
    user.fullName
  )

  if (!newUser) throw new Error("Failed to insert User")

  await db
    .insertInto("accounts")
    .values({ accountId, provider, userId: newUser.id })
    .execute()

  return newUser
}

export async function generateVerificationCode(
  userId: string,
  email: string,
  type: TokenType
) {
  await db
    .deleteFrom("verificationCodes")
    .where((eb) =>
      eb.and([
        eb("userId", "=", userId),
        eb("email", "=", email),
        eb("description", "=", type),
      ])
    )
    .execute()

  const code = generateRandomString(8, alphabet("0-9"))
  await db
    .insertInto("verificationCodes")
    .values({
      userId,
      email,
      expiresAt: createDate(new TimeSpan(7, "d")).toISOString(),
      code,
      description: type,
    })
    .execute()

  return code
}

export const sendVerificationEmailOrLog = (
  c: Context,
  recipient: string,
  verificationCode: string
) => {
  const verificationLink = `${envVars.FRONTEND_URL}/email-verification?code=${verificationCode}&email=${recipient}`
  const emailUrl = `${envVars.EMAIL_URL}`
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
    }),
    headers: {
      "content-type": "application/json",
      ...sentryHeaders,
    },
  })
}

export const sendForgetPasswordEmailOrLog = async (
  c: Context,
  recipient: string,
  verificationCode: string
) => {
  console.log(recipient)
  const emailUrl = envVars.EMAIL_URL
  const [username] = recipient.split("@")
  const resetPasswordLink = `${envVars.FRONTEND_URL}/reset-password?code=${verificationCode}&email=${recipient}`

  const sentryHeaders = generateSentryHeaders(c)
  const request = new Request(emailUrl, {
    method: "POST",
    body: JSON.stringify({
      body: {
        payload: { resetPasswordLink, username },
        template: "ResetPasswordEmail",
      },
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
