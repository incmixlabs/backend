import {
  ACC_DISABLED,
  ERROR_ALREADY_REG,
  ERROR_INVALID_CREDENTIALS,
  ERROR_USER_NOT_FOUND,
  LOGOUT_SUCC,
  USER_DEL,
  VERIFIY_REQ,
} from "@/lib/constants"
import { db, deleteUserById, findUserByEmail, insertUser } from "@/lib/db"
// import { generateVerificationCode } from "@/lib/helper"
import { createSession, initializeLucia } from "@/lib/lucia"
import { deleteUserProfile } from "@/lib/services"
import {
  checkEmailVerification,
  deleteUser,
  getCurrentUser,
  getUser,
  login,
  logout,
  signup,
  validateSession,
} from "@/routes/auth/openapi"
import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  processError,
  zodError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import { Scrypt, generateId } from "lucia"

const authRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})

authRoutes.openapi(getCurrentUser, async (c) => {
  const user = c.get("user")
  const session = c.get("session")
  if (user && session) {
    return c.json(
      {
        ...user,
        session,
      },
      200
    )
  }
  const t = await useTranslation(c)
  const msg = await t.text(ERROR_UNAUTHORIZED)
  return c.json({ message: msg }, 401)
})

authRoutes.openapi(validateSession, async (c) => {
  const user = c.get("user")
  const session = c.get("session")
  if (user && session) {
    return c.json(
      {
        ...user,
        session,
      },
      200
    )
  }

  const t = await useTranslation(c)
  const msg = await t.text(ERROR_UNAUTHORIZED)
  return c.json({ message: msg }, 401)
})

authRoutes.openapi(getUser, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      throw new UnauthorizedError()
    }
    const { id, email } = c.req.valid("query")
    const searchedUser = await db
      .selectFrom("users")
      .selectAll()
      .where((eb) => eb.or([eb("id", "=", id), eb("email", "=", email)]))
      .executeTakeFirst()

    if (!searchedUser) {
      const msg = await t.text(ERROR_USER_NOT_FOUND)
      throw new NotFoundError(msg)
    }
    return c.json(
      {
        id: searchedUser.id,
        userType: searchedUser.userType,
        email: searchedUser.email,
        emailVerified: Boolean(searchedUser.emailVerified),
      },
      200
    )
  } catch (error) {
    return await processError<typeof getUser>(c, error, [
      "{{ default }}",
      "get-user",
    ])
  }
})

authRoutes.openapi(signup, async (c) => {
  const { fullName, email, password } = c.req.valid("json")
  try {
    const existing = await db
      .selectFrom("users")
      .selectAll()
      .where("email", "=", email)
      .executeTakeFirst()

    const t = await useTranslation(c)
    const msg = await t.text(ERROR_ALREADY_REG)
    if (existing) throw new ConflictError(msg)
    const userId = generateId(15)

    // const _verificationCode = await generateVerificationCode(
    //   userId,
    //   email,
    //   "email_verification"
    // )
    // sendVerificationEmailOrLog(c, email, verificationCode)
    const { profile, ...user } = await insertUser(
      c,
      {
        id: userId,
        email,
        emailVerified: true,
        userType: "member",
      },
      fullName,
      password
    )

    return c.json(
      {
        id: user.id,
        userType: user.userType,
        email: user.email,
        emailVerified: Boolean(user.emailVerified),
        fullName: profile.fullName,
        avatar: profile.avatar,
        profileImage: profile.profileImage,
        localeId: profile.localeId,
      },
      201
    )
  } catch (error) {
    return await processError<typeof signup>(c, error, [
      "{{ default }}",
      "signup",
    ])
  }
})

authRoutes.openapi(login, async (c) => {
  try {
    const t = await useTranslation(c)
    const { email, password } = c.req.valid("json")
    console.log(email, password)
    const user = await findUserByEmail(c, email)

    const validPassword = await new Scrypt().verify(
      user.hashedPassword ?? "",
      password
    )
    if (!validPassword) {
      const msg = await t.text(ERROR_INVALID_CREDENTIALS)
      throw new UnauthorizedError(msg)
    }

    if (!user.isActive) {
      const msg = await t.text(ACC_DISABLED)
      throw new ForbiddenError(msg)
    }
    if (!user.emailVerified) {
      const msg = await t.text(VERIFIY_REQ)
      throw new ForbiddenError(msg)
    }

    const session = await createSession(c, user.id)
    return c.json(
      {
        id: user.id,
        userType: user.userType,
        email: user.email,
        emailVerified: Boolean(user.emailVerified),
        session,
      },
      200
    )
  } catch (error) {
    if (error instanceof NotFoundError) {
      const t = await useTranslation(c)
      const msg = await t.text(ERROR_INVALID_CREDENTIALS)
      return c.json({ message: msg }, 401)
    }

    return await processError<typeof login>(c, error, [
      "{{ default }}",
      "login",
    ])
  }
})

authRoutes.openapi(logout, async (c) => {
  const lucia = initializeLucia()
  const session = c.get("session")
  const t = await useTranslation(c)

  if (!session) {
    const msg = await t.text(ERROR_UNAUTHORIZED)
    throw new UnauthorizedError(msg)
  }
  await lucia.invalidateSession(session.id)
  const sessionCookie = lucia.createBlankSessionCookie()
  c.header("Set-Cookie", sessionCookie.serialize(), {
    append: false,
  })

  const msg = await t.text(LOGOUT_SUCC)
  return c.json({ message: msg }, 200)
})

authRoutes.openapi(deleteUser, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)

    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }
    await deleteUserProfile(c, user.id)
    const lucia = initializeLucia()
    await lucia.invalidateUserSessions(user.id)
    await deleteUserById(user.id)
    const sessionCookie = lucia.createBlankSessionCookie()
    c.header("Set-Cookie", sessionCookie.serialize(), {
      append: false,
    })
    const msg = await t.text(USER_DEL)
    return c.json({ message: msg }, 200)
  } catch (error) {
    return await processError<typeof deleteUser>(c, error, [
      "{{ default }}",
      "delete-user",
    ])
  }
})

authRoutes.openapi(checkEmailVerification, async (c) => {
  try {
    const { email } = c.req.valid("json")
    const user = await findUserByEmail(c, email)
    return c.json({ isEmailVerified: Boolean(user.emailVerified) }, 200)
  } catch (error) {
    if (error instanceof NotFoundError) {
      return c.json({ message: "User not found" }, 404)
    }
    return await processError<typeof checkEmailVerification>(c, error, [
      "{{ default }}",
      "check-email-verification",
    ])
  }
})

export default authRoutes
