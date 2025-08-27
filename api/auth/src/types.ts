import type { KyselyDb } from "@incmix-api/utils/db-schema"
import type { Context as HonoContext } from "hono"
import type { Session } from "@/auth/types"
import type { Env } from "@/env-vars"

export type Bindings = Env

export type AuthUser = {
  id: string
  email: string
  isSuperAdmin: boolean
  emailVerified: boolean
}

export type Variables = {
  user: AuthUser | null
  session: Session | null
  db: KyselyDb
}

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
