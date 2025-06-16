import type { Context as HonoContext } from "hono"
import type { Env } from "./env-vars"

export type Bindings = Env

export type HonoApp = { Bindings: Bindings }
export type Context = HonoContext<HonoApp>
