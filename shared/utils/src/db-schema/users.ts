import type { UserType } from "@incmix/utils/types"
import type {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from "kysely"

export type Provider = "google" | "github"

type UsersTable = {
  id: string
  email: string
  hashedPassword: string | null
  emailVerified: boolean
  userType: UserType
  isActive: boolean | null
  lastLoggedIn: ColumnType<Date, null, string>
}

type UserAccountsTable = {
  accountId: string
  provider: Provider
  userId: string
  createdAt: ColumnType<Date, null, string>
}

export type TokenType = "forgot_password" | "email_verification"

type VerificationCodesTable = {
  id: Generated<number>
  userId: string
  code: string
  email: string
  expiresAt: ColumnType<Date, string, null>
  codeType: TokenType
}

type UserProfileTable = {
  id: string
  fullName: string
  email: string
  profileImage: string | null
  avatar: string | null
  localeId: number | null
  companyName: string | null
  companySize: string | null
  teamSize: string | null
  purpose: string | null
  role: string | null
  manageFirst: string | null
  focusFirst: string | null
  referralSources: string[] | null
  onboardingCompleted: boolean
}

export type User = Selectable<UsersTable>
export type Account = Selectable<UserAccountsTable>
export type VerificationCode = Selectable<VerificationCodesTable>

export type NewUser = Insertable<UsersTable>
export type NewAccount = Insertable<UserAccountsTable>
export type NewVerificationCode = Insertable<VerificationCodesTable>

export type UpdatedUser = Updateable<UsersTable>
export type UpdatedAccount = Updateable<UserAccountsTable>
export type UpdatedVerificationCode = Updateable<VerificationCodesTable>

export type UserProfile = Selectable<UserProfileTable>
export type NewUserProfile = Insertable<UserProfileTable>
export type UpdatedUserProfile = Updateable<UserProfileTable>

export type UserProfileColumns = keyof UserProfileTable

export const userProfileColumns: UserProfileColumns[] = [
  "id",
  "fullName",
  "avatar",
  "email",
  "localeId",
  "profileImage",
] as const

export type UserColumns = keyof User

export const userColumns: UserColumns[] = [
  "email",
  "emailVerified",
  "id",
  "userType",
] as const

export type UsersTables = {
  userProfiles: UserProfileTable
  users: UsersTable
  accounts: UserAccountsTable
  verificationCodes: VerificationCodesTable
}
