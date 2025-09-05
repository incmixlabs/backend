import type { KyselyDb } from "@incmix-api/utils/db-schema"
import type { Context as HonoContext } from "hono"
import type { Env } from "./env-vars"

type Bindings = Env

interface User {
  id: string
  email: string
  isSuperAdmin: boolean
  emailVerified: boolean
  [key: string]: any
}

type Variables = {
  user?: User
  db: KyselyDb
  redis?: any
  requestId?: string
  locale?: string
  i18n?: any
  kvStore?: any
}

export type HonoApp = { Bindings: Bindings; Variables: Variables }
export type Context = HonoContext<HonoApp>
