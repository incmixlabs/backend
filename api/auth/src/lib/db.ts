import type { Database, NewUser, User } from "@/dbSchema"
import { ERROR_USER_NOT_FOUND } from "@/lib/constants"
import type { Context } from "@/types"
import { NotFoundError, ServerError } from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import type { UserProfile } from "@jsprtmnn/utils/types"
import { D1Dialect } from "@noxharmonium/kysely-d1"
import { CamelCasePlugin, Kysely } from "kysely"
import { Scrypt } from "lucia"
import { createUserProfile } from "./services"

export const getDatabase = (c: Context) => {
  return new Kysely<Database>({
    dialect: new D1Dialect({ database: c.env.DB }),
    plugins: [new CamelCasePlugin()],
  })
}

export async function findUserByEmail(c: Context, email: string) {
  const db = getDatabase(c)
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
  const db = getDatabase(c)
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
  password?: string
): Promise<User & { profile: UserProfile }> {
  const profile = await createUserProfile(
    c,
    newUser.id,
    fullName,
    newUser.email,
    1
  )

  let hashedPassword: string | null = null
  if (password?.length) hashedPassword = await new Scrypt().hash(password)

  const db = getDatabase(c)
  const user = await db
    .insertInto("users")
    .values({ ...newUser, hashedPassword: hashedPassword })
    .returningAll()
    .executeTakeFirst()
  if (!user) throw new ServerError()

  return { ...user, profile }
}

export async function deleteUserById(c: Context, id: string) {
  const db = getDatabase(c)
  const deletedUser = await db
    .deleteFrom("users")
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirst()

  if (!deletedUser) throw new ServerError()

  return deletedUser
}
