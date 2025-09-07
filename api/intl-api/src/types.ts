import type { KyselyDb } from "@incmix-api/utils/db-schema"
import type { FastifyRequest } from "fastify"
import type { Env } from "./env-vars"

export type Bindings = Env

export type Variables = {
  db: KyselyDb
}

export type Context = FastifyRequest & {
  db: KyselyDb | null
}
