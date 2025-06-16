import type { AuthUser as User } from "@incmix/utils/types"
import type { Context as HonoContext } from "hono"
import type { Env } from "./env-vars"

export type Bindings = Env

type Variables = {
  user: User | null
}

export type HonoApp = { Bindings: Bindings; Variables: Variables }
export type Context = HonoContext<HonoApp>
