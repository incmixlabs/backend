import {
  EMAIL_ALREADY_VERIFIED,
  ERROR_INVALID_CODE,
  ERROR_USER_NOT_FOUND,
  MAIL_SENT,
  VERIFY_SUCCESS,
} from "@/lib/constants"
import { db, findUserByEmail } from "@/lib/db"
import {
  generateVerificationCode,
  sendVerificationEmailOrLog,
  verifyVerificationCode,
} from "@/lib/helper"
import { initializeLucia } from "@/lib/lucia"
import {
  sendVerificationEmail,
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

emailVerificationRoutes.openapi(sendVerificationEmail, async (c) => {
  try {
    const { email } = c.req.valid("json")
    const user = await findUserByEmail(c, email)
    const t = await useTranslation(c)
    if (user.emailVerified) {
      const msg = await t.text(EMAIL_ALREADY_VERIFIED)
      return c.json({ message: msg }, 200)
    }

    const verificationCode = await generateVerificationCode(
      user.id,
      email,
      "email_verification"
    )

    await sendVerificationEmailOrLog(c, email, verificationCode)
    const msg = await t.text(MAIL_SENT)
    return c.json({ message: msg }, 200)
  } catch (error) {
    return await processError<typeof sendVerificationEmail>(c, error, [
      "{{ default }}",
      "send-verification-email",
    ])
  }
})

emailVerificationRoutes.openapi(verifyEmail, async (c) => {
  try {
    const { code, email } = c.req.valid("json")
    const user = await findUserByEmail(c, email)

    const lucia = initializeLucia()
    await lucia.invalidateUserSessions(user.id)
    const sessionCookie = lucia.createBlankSessionCookie()
    c.header("Set-Cookie", sessionCookie.serialize(), {
      append: false,
    })

    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_USER_NOT_FOUND)
      throw new NotFoundError(msg)
    }

    const validCode = await verifyVerificationCode(
      user,
      code,
      "email_verification"
    )
    if (!validCode) {
      const msg = await t.text(ERROR_INVALID_CODE)
      throw new UnauthorizedError(msg)
    }

    await db
      .updateTable("users")
      .set({ emailVerified: true })
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
