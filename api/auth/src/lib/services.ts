import type { MessageResponse } from "@/routes/types"
import type { Context } from "@/types"
import { BadRequestError, ServerError } from "@incmix-api/utils/errors"
import type { UserProfile } from "@incmix/utils/types"

export async function getUserProfile(c: Context, id: string, _cookie: string) {
  // User profile is now handled directly in the auth service
  const user = await c
    .get("db")
    .selectFrom("users")
    .innerJoin("userProfiles", "users.id", "userProfiles.id")
    .select([
      "users.id",
      "users.email",
      "userProfiles.fullName as name",
      "userProfiles.avatar",
      "userProfiles.profileImage",
      "userProfiles.localeId",
    ])
    .where("users.id", "=", id)
    .executeTakeFirst()

  if (!user) {
    throw new BadRequestError("User not found")
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    profileImage: user.profileImage,
    localeId: user.localeId || 1,
  } as UserProfile
}
export async function createUserProfile(
  c: Context,
  id: string,
  fullName: string,
  email: string,
  localeId: number
) {
  // User profile creation is now handled directly in the auth service
  const db = c.get("db")

  // Check if profile already exists
  const existingProfile = await db
    .selectFrom("userProfiles")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst()

  if (!existingProfile) {
    // Create new profile
    await db
      .insertInto("userProfiles")
      .values({
        id,
        email,
        fullName: fullName || email,
        localeId,
        onboardingCompleted: false,
      })
      .onConflict((oc) => oc.column("id").doNothing())
      .execute()
  }

  const user = await db
    .selectFrom("users")
    .innerJoin("userProfiles", "users.id", "userProfiles.id")
    .select([
      "users.id",
      "users.email",
      "userProfiles.fullName as name",
      "userProfiles.avatar",
      "userProfiles.profileImage",
      "userProfiles.localeId",
    ])
    .where("users.id", "=", id)
    .executeTakeFirst()

  if (!user) {
    throw new ServerError("Failed to create user profile")
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    profileImage: user.profileImage,
    localeId: user.localeId || 1,
  } as UserProfile
}
export async function deleteUserProfile(c: Context, id: string) {
  // User deletion is now handled directly in the auth service
  const db = c.get("db")

  const result = await db
    .deleteFrom("userProfiles")
    .where("id", "=", id)
    .executeTakeFirst()

  if (result.numDeletedRows === 0n) {
    throw new BadRequestError()
  }
  await db.transaction().execute(async (trx) => {
    const res = await trx
      .deleteFrom("userProfiles")
      .where("id", "=", id)
      .executeTakeFirst()

    if (res.numDeletedRows === 0n) {
      throw new BadRequestError("User profile not found")
    }

    await trx.deleteFrom("users").where("id", "=", id).executeTakeFirst()
  })
  return { message: "User profile deleted successfully" } as MessageResponse
}
