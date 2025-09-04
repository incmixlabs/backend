import type { MessageResponse } from "@/routes/types"
import type { Context } from "@/types"
import { BadRequestError, ServerError } from "@incmix-api/utils/errors"

export type ProfileDTO = {
  id: string
  email: string
  name: string
  avatar: string | null
  profileImage: string | null
  localeId: number
}

export async function getUserProfile(
  c: Context,
  id: string,
  _cookie: string
): Promise<ProfileDTO> {
  // User profile is now handled directly in the auth service
  const user = await c
    .get("db")
    .selectFrom("users")
    .innerJoin("userProfiles", "users.id", "userProfiles.id")
    .select([
      "users.id",
      "users.email",
      "userProfiles.fullName",
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
    name: user.fullName,
    avatar: user.avatar,
    profileImage: user.profileImage,
    localeId: user.localeId ?? 1,
  }
}

export async function createUserProfile(
  c: Context,
  id: string,
  fullName: string,
  email: string,
  localeId: number
): Promise<ProfileDTO> {
  // Ensure user profile exists
  try {
    await c
      .get("db")
      .insertInto("userProfiles")
      .values({
        id,
        email,
        fullName: fullName || email,
        onboardingCompleted: false,
        localeId,
      })
      .onConflict((oc) => oc.column("id").doNothing())
      .execute()
  } catch (error) {
    console.error("Error creating user profile:", error)
  }

  // Fetch the user profile
  const user = await c
    .get("db")
    .selectFrom("users")
    .innerJoin("userProfiles", "users.id", "userProfiles.id")
    .select([
      "users.id",
      "users.email",
      "userProfiles.fullName",
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
    name: user.fullName,
    avatar: user.avatar,
    profileImage: user.profileImage,
    localeId: user.localeId ?? 1,
  }
}

export async function deleteUserProfile(
  c: Context,
  id: string
): Promise<MessageResponse> {
  // Delete user profile
  const result = await c
    .get("db")
    .deleteFrom("userProfiles")
    .where("id", "=", id)
    .execute()

  if (result.length === 0) {
    throw new BadRequestError("User profile not found")
  }

  // Delete user
  await c.get("db").deleteFrom("users").where("id", "=", id).execute()

  return {
    message: "User profile deleted successfully",
  }
}
