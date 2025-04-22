import type { Database, NewUser } from "@/dbSchema"
import { envVars } from "@/env-vars"
import { ERROR_USER_NOT_FOUND } from "@/lib/constants"
import type { Onboarding } from "@/routes/auth/types"
import type { Context } from "@/types"
import { NotFoundError, ServerError } from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely"
import { Scrypt } from "lucia"
import pg from "pg"
import { createUserProfile } from "./services"
const dialect = new PostgresDialect({
  pool: new pg.Pool({
    connectionString: envVars.DATABASE_URL,
    max: 10,
  }),
})
export const db = new Kysely<Database>({
  dialect,
  plugins: [new CamelCasePlugin()],
})

export async function findUserByEmail(c: Context, email: string) {
  const user = await db
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
  const user = await db
    .selectFrom("users")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst()
  const t = await useTranslation(c)
  if (!user) {
    const msg = await t.text(ERROR_USER_NOT_FOUND)
    throw new NotFoundError(msg)
  }

  return user
}

export async function insertUser(
  c: Context,
  newUser: NewUser,
  fullName: string,
  password?: string,
  onboarding?: Onboarding
) {
  if (onboarding) {
    await createUserProfile(
      c,
      newUser.id,
      fullName,
      newUser.email,
      1,
      onboarding
    )
  }

  let hashedPassword: string | null = null
  if (password?.length) hashedPassword = await new Scrypt().hash(password)

  const user = await db
    .insertInto("users")
    .values({ ...newUser, hashedPassword: hashedPassword })
    .returningAll()
    .executeTakeFirst()
  if (!user) throw new ServerError()

  return { ...user, profile: onboarding ? onboarding : null }
}

export async function deleteUserById(id: string) {
  const deletedUser = await db
    .deleteFrom("users")
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirst()

  if (!deletedUser) throw new ServerError()

  return deletedUser
}
