import type { KyselyDb } from "@incmix-api/utils/db-schema"
import type { AuthUser as User } from "@incmix/utils/types"
import type { Context as HonoContext } from "hono"
import type { ENV } from "./env-vars"

type Bindings = ENV

type Variables = {
  user: User | null
  db: KyselyDb
}

export type HonoApp = { Bindings: Bindings; Variables: Variables }
export type Context = HonoContext<HonoApp>
