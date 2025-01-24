import type { AuthUser as User } from "@incmix/utils/types"
import type { Context as HonoContext } from "hono"

type Bindings = {
  DB: D1Database
  AUTH: Fetcher
  AUTH_URL: string
  USERS: Fetcher
  USERS_URL: string
  COOKIE_NAME: string
  INTL: Fetcher
  INTL_URL: string
  DOMAIN: string
}

type Variables = {
  user: User | null
}

export type HonoApp = { Bindings: Bindings; Variables: Variables }
export type Context = HonoContext<HonoApp>
