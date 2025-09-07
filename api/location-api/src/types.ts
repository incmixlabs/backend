import type { KyselyDb } from "@incmix-api/utils/db-schema"
import type { FastifyReply, FastifyRequest } from "fastify"
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
  db: KyselyDb
  redis?: any
  requestId?: string
  user?: {
    id: string
    email: string
    [key: string]: any
  }
  locale?: string
  i18n?: any
  kvStore?: any
}

export type AppRequest = FastifyRequest
export type AppReply = FastifyReply
