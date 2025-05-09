import type { UserType } from "@incmix/utils/types"
import type { Insertable, Selectable, Updateable } from "kysely"

export type UserRow = {
  id: string
  email: string
  user_type: UserType
}

export type UserProfileTable = {
  id: string
  fullName: string
  email: string
  profileImage: string | null
  avatar: string | null
  localeId: number
  companyName: string
  companySize: string
  teamSize: string
  purpose: string
  role: string
  manageFirst: string
  focusFirst: string
  referralSources: string[]
  onboardingCompleted?: boolean
}

export type Database = {
  userProfiles: UserProfileTable
}

export type UserProfile = Selectable<UserProfileTable>
export type NewUserProfile = Insertable<UserProfileTable>
export type UpdatedUser = Updateable<UserProfileTable>

export type UserProfileColumn = keyof UserProfileTable
export const columns: UserProfileColumn[] = [
  "id",
  "fullName",
  "avatar",
  "email",
  "localeId",
  "profileImage",
] as const
