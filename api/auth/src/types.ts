import type { Clients } from "@/durable-objects/clients"
import type { AuthUser } from "@jsprtmnn/utils/types"
import type { Context as HonoContext } from "hono"
import type { Session } from "lucia"

type EnvVariables = {
  EMAIL_URL: string
  FRONTEND_URL: string
  USERS_API_URL: string
  INTL_URL: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  GOOGLE_REDIRECT_URL: string
  COOKIE_NAME: string
  DOMAIN: string
}

type Services = {
  DB: D1Database
  EMAIL: Fetcher
  USERS_API: Fetcher
  INTL: Fetcher
  CLIENTS: DurableObjectNamespace<Clients>
}

export type Bindings = EnvVariables & Services

export type Variables = {
  user: AuthUser | null
  session: Session | null
}

export type HonoApp = { Bindings: Bindings; Variables: Variables }
export type Context = HonoContext<HonoApp>
