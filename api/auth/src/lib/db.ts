import type {
  KyselyDb,
  NewUser,
  NewUserProfile,
} from "@incmix-api/utils/db-schema"
import { NotFoundError, ServerError } from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import type { FastifyRequest } from "fastify"
import { hashPassword } from "@/auth/utils"
import { ERROR_USER_NOT_FOUND } from "@/lib/constants"

export async function findUserByEmail(request: FastifyRequest, email: string) {
  const db = request.db
  if (!db) {
    throw new ServerError("Database not available")
  }

  const user = await db
    .selectFrom("users")
    .selectAll()
    .where("email", "=", email)
    .executeTakeFirst()
  if (!user) {
    // Use fallback message if translation system is not available (e.g., in tests)
    let msg = "User not found"
    try {
      const t = await useTranslation(request)
      msg = await t.text(ERROR_USER_NOT_FOUND)
    } catch (_error) {
      // Fall back to default message if i18n is not available
      console.warn("Translation system not available, using fallback message")
    }
    throw new NotFoundError(msg)
  }

  return user
}

export async function findUserById(request: FastifyRequest, id: string) {
  const db = request.db
  if (!db) {
    throw new ServerError("Database not available")
  }

  const user = await db
    .selectFrom("users")
    .innerJoin("userProfiles", "users.id", "userProfiles.id")
    .select([
      "users.id",
      "users.email",
      "users.isSuperAdmin",
      "users.emailVerifiedAt",
      "userProfiles.fullName",
      "userProfiles.avatar",
      "userProfiles.profileImage",
      "userProfiles.localeId",
      "userProfiles.onboardingCompleted",
      "users.hashedPassword",
    ])
    .where("users.id", "=", id)
    .executeTakeFirst()
  if (!user) {
    // Use fallback message if translation system is not available (e.g., in tests)
    let msg = "User not found"
    try {
      const t = await useTranslation(request)
      msg = await t.text(ERROR_USER_NOT_FOUND)
    } catch (_error) {
      // Fall back to default message if i18n is not available
      console.warn("Translation system not available, using fallback message")
    }
    throw new NotFoundError(msg)
  }

  return user
}

async function createUserProfile(
  request: FastifyRequest,
  newUserProfile: NewUserProfile,
  dbInstance?: KyselyDb
) {
  const db = dbInstance ?? request.db
  if (!db) {
    throw new ServerError("Database not available")
  }

  const userProfile = await db
    .insertInto("userProfiles")
    .values(newUserProfile)
    .returningAll()
    .executeTakeFirst()

  return userProfile
}

export async function insertUser(
  request: FastifyRequest,
  newUser: NewUser,
  fullName: string,
  password?: string,
  dbInstance?: KyselyDb
) {
  const db = dbInstance ?? request.db
  if (!db) {
    throw new ServerError("Database not available")
  }

  const locale = await db
    .selectFrom("locales")
    .selectAll()
    .where("isDefault", "=", true)
    .executeTakeFirst()

  let hashedPassword: string | null = null
  if (password?.length) hashedPassword = await hashPassword(password)

  const user = await db
    .insertInto("users")
    .values({ ...newUser, hashedPassword: hashedPassword })
    .returningAll()
    .executeTakeFirst()
  if (!user) throw new ServerError()

  const profile = await createUserProfile(
    request,
    {
      id: newUser.id,
      fullName,
      email: newUser.email,
      localeId: locale?.id,
      onboardingCompleted: false,
    },
    db
  )

  return { ...user, profile }
}

export async function deleteUserById(request: FastifyRequest, id: string) {
  const db = request.db
  if (!db) {
    throw new ServerError("Database not available")
  }

  const deletedUser = await db.transaction().execute(async (tx) => {
    await tx.deleteFrom("userProfiles").where("id", "=", id).execute()
    return await tx
      .deleteFrom("users")
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst()
  })
  if (!deletedUser) throw new ServerError()

  return deletedUser
}
