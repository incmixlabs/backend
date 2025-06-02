import type { KyselyDb } from "@incmix-api/utils/db-schema"
import type { Context as HonoContext } from "hono"
import type { Env } from "./env-vars"

export type Bindings = Env

export type Variables = {
  db: KyselyDb
}

export type HonoApp = { Bindings: Bindings; Variables: Variables }
export type Context = HonoContext<HonoApp>
