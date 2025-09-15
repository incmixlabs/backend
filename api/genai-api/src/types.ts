import type { KyselyDb } from "@incmix-api/utils/db-schema"
import type { FastifyReply, FastifyRequest } from "fastify"
import type { Env } from "./env-vars"

interface User {
  id: string
  email: string
  isSuperAdmin: boolean
  emailVerified: boolean
  [key: string]: any
}

declare module "fastify" {
  interface FastifyRequest {
    user?: User
    db: KyselyDb
    redis?: any
    requestId?: string
    locale?: string
    i18n?: any
    kvStore?: any
    env: Env
  }
}

export type Context = {
  request: FastifyRequest
  reply: FastifyReply
}
