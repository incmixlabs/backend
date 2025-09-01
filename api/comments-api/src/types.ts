import type { KyselyDb } from "@incmix-api/utils/db-schema"
import type { AuthUser as User } from "@incmix/utils/types"
import type { Context as HonoContext } from "hono"
import type { Env } from "./env-vars"

type Bindings = Env

type Variables = {
  user: User | null
  db: KyselyDb
}

export type HonoApp = { Bindings: Bindings; Variables: Variables }
export type Context = HonoContext<HonoApp>
