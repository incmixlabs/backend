import { setSessionCookie } from "@/auth/cookies"
import { createSession, invalidateAllSessions } from "@/auth/session"
import {
  EMAIL_ALREADY_VERIFIED,
  ERROR_INVALID_CODE,
  ERROR_USER_NOT_FOUND,
  MAIL_SENT,
  VERIFY_SUCCESS,
} from "@/lib/constants"
import { findUserByEmail } from "@/lib/db"
import {
  generateVerificationCode,
  sendVerificationEmail,
  verifyVerificationCode,
} from "@/lib/helper"

import {
  sendVerificationEmail as sendVerificationEmailRoute,
  verifyEmail,
} from "@/routes/email-verification/openapi"
import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import {
  NotFoundError,
  UnauthorizedError,
  processError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"

const emailVerificationRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

emailVerificationRoutes.openapi(sendVerificationEmailRoute, async (c) => {
  try {
    const { email } = c.req.valid("json")
    const user = await findUserByEmail(c, email)
    const t = await useTranslation(c)
    if (user.emailVerifiedAt) {
      const msg = await t.text(EMAIL_ALREADY_VERIFIED)
      return c.json({ message: msg }, 200)
    }

    const verificationCode = await generateVerificationCode(
      c,
      user.id,
      email,
      "email_verification"
    )

    sendVerificationEmail(c, email, verificationCode, user.id)
    const msg = await t.text(MAIL_SENT)
    return c.json({ message: msg }, 200)
  } catch (error) {
    return await processError<typeof sendVerificationEmailRoute>(c, error, [
      "{{ default }}",
      "send-verification-email",
    ])
  }
})

emailVerificationRoutes.openapi(verifyEmail, async (c) => {
  try {
    const { code, email } = c.req.valid("json")
    const user = await findUserByEmail(c, email)

    await invalidateAllSessions(c.get("db"), user.id)
    const session = await createSession(c.get("db"), user.id)
    setSessionCookie(c, session.id, new Date(session.expiresAt))

    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_USER_NOT_FOUND)
      throw new NotFoundError(msg)
    }

    const validCode = await verifyVerificationCode(
      c,
      user,
      code,
      "email_verification"
    )
    if (!validCode) {
      const msg = await t.text(ERROR_INVALID_CODE)
      throw new UnauthorizedError(msg)
    }

    await c
      .get("db")
      .updateTable("users")
      .set({ emailVerifiedAt: new Date().toISOString() })
      .where("id", "=", user.id)
      .execute()

    const msg = await t.text(VERIFY_SUCCESS)
    return c.json({ message: msg }, 200)
  } catch (error) {
    return await processError<typeof verifyEmail>(c, error, [
      "{{ default }}",
      "verify-email",
    ])
  }
})

export default emailVerificationRoutes
