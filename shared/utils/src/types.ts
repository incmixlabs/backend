import type { KyselyDb } from "@incmix-api/utils/db-schema"
import type { Context as HonoContext } from "hono"
import type { Env } from "./env-config"
// TODO - replace `any` with the actual transaction type from Kysely when possible
export type TXN = any
export type Bindings = Env
export type OC = any
export interface Session {
  id: string
  userId: string
  expiresAt: string // ISO string
  fresh: boolean
}

// Optionally, define a type for the DB pool (PostgreSQL)
export type DBPool = import("pg").Pool

// Optionally, define a type for the HTTP response (Hono context)
export type HTTPResponse = import("hono").Context

export type IntlMessage = {
  locale: string
  key: string
  value: string
  namespace: string
  type: "frag" | "label"
}

export type Locale = {
  code: string
  isDefault: boolean
}

export type AuthUser = {
  id: string
  fullName: string
  email: string
  isSuperAdmin: boolean
  emailVerified: boolean
}

export type Variables = {
  user?: AuthUser
  session?: Session
  db: KyselyDb
  redis?: any
  requestId?: string
  locale?: string
  i18n?: any
  kvStore?: any
}
export type User = AuthUser
export type GoogleUser = {
  sub: string
  name: string
  given_name: string
  family_name: string
  picture: string
  email: string
  email_verified: boolean
}

export type HonoApp = { Bindings: Bindings; Variables: Variables }
export type Context = HonoContext<HonoApp>
