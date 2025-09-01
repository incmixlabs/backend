import { hashPassword } from "@/auth/utils"
import { ERROR_USER_NOT_FOUND } from "@/lib/constants"
import type { Context } from "@/types"
import type {
  KyselyDb,
  NewUser,
  NewUserProfile,
} from "@incmix-api/utils/db-schema"
import { NotFoundError, ServerError } from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"

export async function findUserByEmail(c: Context, email: string) {
  const user = await c
    .get("db")
    .selectFrom("users")
    .selectAll()
    .where("email", "=", email)
    .executeTakeFirst()
  const t = await useTranslation(c)

  if (!user) {
    const msg = await t.text(ERROR_USER_NOT_FOUND)
    throw new NotFoundError(msg)
  }

  return user
}

export async function findUserById(c: Context, id: string) {
  const user = await c
    .get("db")
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
  const t = await useTranslation(c)
  if (!user) {
    const msg = await t.text(ERROR_USER_NOT_FOUND)
    throw new NotFoundError(msg)
  }

  return user
}

async function createUserProfile(
  c: Context,
  newUserProfile: NewUserProfile,
  dbInstance?: KyselyDb
) {
  const db = dbInstance ?? c.get("db")
  const userProfile = await db
    .insertInto("userProfiles")
    .values(newUserProfile)
    .returningAll()
    .executeTakeFirst()

  return userProfile
}

export async function insertUser(
  c: Context,
  newUser: NewUser,
  fullName: string,
  password?: string,
  dbInstance?: KyselyDb
) {
  const db = dbInstance ?? c.get("db")

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
    c,
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

export async function deleteUserById(c: Context, id: string) {
  const deletedUser = await c
    .get("db")
    .transaction()
    .execute(async (tx) => {
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
