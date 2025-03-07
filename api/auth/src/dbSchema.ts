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
}

export type TokenType = "forgot_password" | "email_verification"

export type VerificationCodesTable = {
  id: Generated<number>
  userId: string
  code: string
  email: string
  expiresAt: ColumnType<Date, string, null>
  description: TokenType
}

export type Database = {
  users: UsersTable
  accounts: UserAccountsTable
  verificationCodes: VerificationCodesTable
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

export type GoogleUser = {
  sub: string
  name: string
  given_name: string
  family_name: string
  picture: string
  email: string
  email_verified: boolean
}

export type UserColumn = keyof User
export const columns: UserColumn[] = [
  "email",
  "emailVerified",
  "id",
  "userType",
] as const
