import type { Database } from "@incmix-api/utils/db-schema"
import type { Context as HonoContext } from "hono"
import type { Kysely } from "kysely"
import type { Env } from "./env-vars"

type EnvVariables = Env

export type Bindings = EnvVariables

export type Address = {
  name: string
  city: string
  state: string
  country: string
  country_code: string
  lat: string
  lon: string
}

export type Variables = {
  defaultLocation: Address
  db?: Kysely<Database>
}

export type HonoApp = { Bindings: Bindings; Variables: Variables }
export type Context = HonoContext<HonoApp>
