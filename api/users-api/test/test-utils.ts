import type { UserProfile } from "@jsprtmnn/utils/types"

export const defaultHeaders = {
  origin: "http://localhost:1420",
  "accept-language": "en",
}

export const insertUser = async (
  db: D1Database,
  { email, fullName, localeId, avatar, id, profileImage }: UserProfile
) => {
  return await db
    .prepare(
      "insert into user_profiles (id, email, full_name, profile_image, avatar, locale_id) values (?,?,?,?,?,?) returning *"
    )
    .bind(id, email, fullName, profileImage, avatar, localeId)
    .run()
}
