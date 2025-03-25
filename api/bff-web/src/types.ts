import type { Context as HonoContext } from "hono"
type EnvVariables = {
  USERS_URL: string
  INTL_URL: string
  ORG_URL: string
  AUTH_URL: string
  TASKS_URL: string
  EMAIL_URL: string
  FILES_URL: string
  LOCATION_URL: string
}

export type Bindings = EnvVariables

export type HonoApp = { Bindings: Bindings }
export type Context = HonoContext<HonoApp>
