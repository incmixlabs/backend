import type { FastifyInstance, FastifyRequest } from "fastify"
import type { Kysely } from "kysely"

// Redis client type - define as any to avoid redis package dependency
export type RedisClientType = any

export interface CommonBindings {
  DATABASE_URL: string
  REDIS_URL?: string
  SENTRY_DSN?: string
  NODE_ENV?: string
}

export interface CommonVariables {
  db: Kysely<any>
  redis?: RedisClientType
  requestId?: string
  user?: {
    id: string
    email: string
    [key: string]: any
  }
  locale?: string
}

export type FastifyApp<
  _TBindings extends CommonBindings = CommonBindings,
  _TVariables extends CommonVariables = CommonVariables,
> = FastifyInstance

export type FastifyContext<
  _TBindings extends CommonBindings = CommonBindings,
  _TVariables extends CommonVariables = CommonVariables,
> = FastifyRequest
