import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import type { Kysely } from "kysely"
import type { Database } from "../db-schema"

export interface FastifyServiceBindings {
  DATABASE_URL?: string
  [key: string]: any
}

export interface FastifyServiceContext {
  db?: Kysely<Database>
  [key: string]: any
}

declare module "fastify" {
  interface FastifyRequest {
    context?: FastifyServiceContext
  }
}

export interface FastifyServiceConfig {
  name: string
  version?: string
  port: number
  basePath: string
  setupMiddleware?: (app: FastifyInstance) => Promise<void>
  setupRoutes?: (app: FastifyInstance) => Promise<void>
  needDb?: boolean
  needSwagger?: boolean
  onBeforeStart?: () => Promise<void>
  onAfterStart?: () => Promise<void>
  bindings?: FastifyServiceBindings
  cors?: {
    origin?: string | string[] | boolean
    credentials?: boolean
  }
}

export type RouteHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<any> | any
