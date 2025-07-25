import { setSessionCookie } from "@/auth/cookies"
import { createSession } from "@/auth/session"
import { hashPassword, verifyPassword } from "@/auth/utils"
import {
  ERROR_INVALID_CODE,
  ERROR_WRONG_PASSWORD,
  MAIL_SENT,
  PASS_RESET_SUCCESS,
} from "@/lib/constants"
import { findUserByEmail, findUserById } from "@/lib/db"

import {
  generateVerificationCode,
  sendForgetPasswordEmail,
  verifyVerificationCode,
} from "@/lib/helper"

import {
  forgetPassword,
  resetPassword,
  sendForgetPasswordEmail as sendForgetPasswordEmailRoute,
} from "@/routes/reset-password/openapi"
import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import {
  UnauthorizedError,
  processError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"

const resetPasswordRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

resetPasswordRoutes.openapi(resetPassword, async (c) => {
  try {
    const currentUser = c.get("user")

    if (!currentUser) {
      throw new UnauthorizedError()
    }

    const user = await findUserById(c, currentUser.id)

    const { newPassword, currentPassword } = c.req.valid("json")

    const validPassword = await verifyPassword(
      user.hashedPassword ?? "",
      currentPassword
    )
    const t = await useTranslation(c)
    if (!validPassword) {
      const msg = await t.text(ERROR_WRONG_PASSWORD)
      throw new UnauthorizedError(msg)
    }

    const newHash = await hashPassword(newPassword)

    await c
      .get("db")
      .updateTable("users")
      .set({ hashedPassword: newHash })
      .where("id", "=", currentUser.id)
      .execute()

    const session = await createSession(c.get("db"), currentUser.id)
    setSessionCookie(c, session.id, new Date(session.expiresAt))
    const msg = await t.text(PASS_RESET_SUCCESS)

    return c.json({ message: msg })
  } catch (error) {
    return await processError<typeof resetPassword>(c, error, [
      "{{ default }}",
      "reset-password",
    ])
  }
})

resetPasswordRoutes.openapi(sendForgetPasswordEmailRoute, async (c) => {
  try {
    const { email } = c.req.valid("json")
    const user = await findUserByEmail(c, email)

    const verificationCode = await generateVerificationCode(
      c,
      user.id,
      email,
      "forgot_password"
    )

    await sendForgetPasswordEmail(c, email, verificationCode)
    const t = await useTranslation(c)
    const msg = await t.text(MAIL_SENT)
    return c.json({ message: msg }, 200)
  } catch (error) {
    return await processError<typeof sendForgetPasswordEmailRoute>(c, error, [
      "{{ default }}",
      "forget-password-email",
    ])
  }
})

resetPasswordRoutes.openapi(forgetPassword, async (c) => {
  try {
    const { code, newPassword, email } = c.req.valid("json")

    const user = await findUserByEmail(c, email)

    const validCode = await verifyVerificationCode(
      c,
      {
        email,
        id: user.id,
      },
      code,
      "forgot_password"
    )
    const t = await useTranslation(c)
    if (!validCode) {
      const msg = await t.text(ERROR_INVALID_CODE)
      throw new UnauthorizedError(msg)
    }

    const newHash = await hashPassword(newPassword)

    await c
      .get("db")
      .updateTable("users")
      .set({ hashedPassword: newHash })
      .where("id", "=", user.id)
      .execute()

    const msg = await t.text(PASS_RESET_SUCCESS)
    return c.json({ message: msg }, 200)
  } catch (error) {
    return await processError<typeof forgetPassword>(c, error, [
      "{{ default }}",
      "forgetPassword",
    ])
  }
})

export default resetPasswordRoutes
