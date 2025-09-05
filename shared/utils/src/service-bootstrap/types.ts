import type { Context } from "hono"
import type { Kysely } from "kysely"
import type { AjvOpenApiHono } from "../openapi/ajv-openapi"
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

export type HonoApp<
  TBindings extends CommonBindings = CommonBindings,
  TVariables extends CommonVariables = CommonVariables,
> = AjvOpenApiHono<{
  Bindings: TBindings
  Variables: TVariables
}>

export type HonoContext<
  TBindings extends CommonBindings = CommonBindings,
  TVariables extends CommonVariables = CommonVariables,
> = Context<{
  Bindings: TBindings
  Variables: TVariables
}>
