import type { KyselyDb } from "@incmix-api/utils/db-schema"
import type { FastifyReply, FastifyRequest } from "fastify"
import type { Env } from "./env-vars"

export type Bindings = Env

export interface User {
  id: string
  email: string
  isSuperAdmin: boolean
  emailVerified: boolean
  [key: string]: any
}

export type Variables = {
  user?: User
  db: KyselyDb
  redis?: any
  requestId?: string
  locale?: string
  i18n?: any
  kvStore?: any
}

export type AppRequest = FastifyRequest
export type AppReply = FastifyReply

export interface Context {
  get<T extends keyof Variables>(key: T): Variables[T]
  set<T extends keyof Variables>(key: T, value: Variables[T]): void
}
