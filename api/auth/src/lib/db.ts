import type {
  KyselyDb,
  NewUser,
  NewUserProfile,
} from "@incmix-api/utils/db-schema"
import { NotFoundError, ServerError } from "@incmix-api/utils/errors"
import type { FastifyServiceContext as Context } from "@incmix-api/utils/fastify-bootstrap"
import type { TXN } from "@incmix-api/utils/types"
import { hashPassword } from "@/auth/utils"

const getDb = (c: Context) => {
  const db = c.db
  if (!db) {
    throw new ServerError()
  }
  return db
}

export async function findUserByEmail(c: Context, email: string) {
  const db = getDb(c)
  if (!db) {
    throw new ServerError()
  }
  const user = await db
    .selectFrom("users")
    .selectAll()
    .where("email", "=", email)
    .executeTakeFirst()
  // const t = await useTranslation(c)

  if (!user) {
    // const msg = await t.text(ERROR_USER_NOT_FOUND)
    throw new NotFoundError("User not found")
  }

  return user
}

export async function findUserById(c: Context, id: string) {
  const db = getDb(c)
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
  // const t = await useFastifyTranslation(c)
  if (!user) {
    // const msg = await t.text(ERROR_USER_NOT_FOUND)
    throw new NotFoundError("User not found")
  }

  return user
}

async function createUserProfile(
  c: Context,
  newUserProfile: NewUserProfile,
  dbInstance?: KyselyDb
) {
  const db = dbInstance ?? getDb(c)
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
  const db = dbInstance ?? getDb(c)

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
    .getDb(c)
    .transaction()
    .execute(async (tx: TXN) => {
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
