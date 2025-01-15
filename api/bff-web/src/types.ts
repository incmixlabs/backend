import type { Context as HonoContext } from "hono"
type EnvVariables = {
  USERS_URL: string
  INTL_URL: string
  ORG_URL: string
  AUTH_URL: string
  TODO_URL: string
  EMAIL_URL: string
  FILES_URL: string
  LOCATION_URL: string
}

type Services = {
  ORG_API: Fetcher
  AUTH_API: Fetcher
  TODO_API: Fetcher
  USERS_API: Fetcher
  EMAIL_API: Fetcher
  FILES_API: Fetcher
  INTL_API: Fetcher
  LOCATION_API: Fetcher
}

export type Bindings = EnvVariables & Services

export type HonoApp = { Bindings: Bindings }
export type Context = HonoContext<HonoApp>
