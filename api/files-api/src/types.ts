import type { AuthUser as User } from "@incmix/shared/types"
import type { Context as HonoContext } from "hono"

type Bindings = {
  AUTH: Fetcher
  AUTH_URL: string
  COOKIE_NAME: string
  INTL: Fetcher
  INTL_URL: string
  MY_BUCKET: R2Bucket
  BUCKET_NAME: string
  PORT?: string
  DOMAIN: string
  R2_ENDPOINT: string
  R2_ACCESS_KEY_ID: string
  R2_SECRET_ACCESS_KEY: string
}

type Variables = {
  user: User | null
}

export type HonoApp = { Bindings: Bindings; Variables: Variables }
export type Context = HonoContext<HonoApp>
