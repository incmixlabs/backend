import { serve } from "@hono/node-server"
import { OpenAPIHono } from "@hono/zod-openapi"
import type { Context, Env } from "hono"
import { logger } from "hono/logger"
import { KVStore } from "../kv-store"

export interface ServiceConfig<
  TBindings extends object = Record<string, unknown>,
  TVariables extends object = Record<string, unknown>,
> {
  name: string
  version?: string
  port: number
  setupMiddleware?: (
    app: OpenAPIHono<{ Bindings: TBindings; Variables: TVariables }>
  ) => void
  setupRoutes?: (
    app: OpenAPIHono<{ Bindings: TBindings; Variables: TVariables }>
  ) => void
  setupRBAC?: () => void
  onBeforeStart?: () => Promise<void>
  bindings?: TBindings
  variables?: TVariables
}

export function createService<
  TBindings extends object = Record<string, unknown>,
  TVariables extends object = Record<string, unknown>,
>(config: ServiceConfig<TBindings, TVariables>) {
  const app = new OpenAPIHono<{
    Bindings: TBindings
    Variables: TVariables
  }>()

  // Initialize KVStore
  const kvStore = new KVStore({ name: config.name })

  // Setup logger
  app.use(logger())

  // Setup middleware if provided
  if (config.setupMiddleware) {
    config.setupMiddleware(app)
  }

  // Setup RBAC if provided
  if (config.setupRBAC) {
    config.setupRBAC()
  }

  // Setup routes if provided
  if (config.setupRoutes) {
    config.setupRoutes(app)
  }

  // OpenAPI documentation endpoint
  app.doc("/doc", {
    openapi: "3.0.0",
    info: {
      version: config.version || "1.0.0",
      title: `${config.name} API`,
    },
  })

  // Start server
  const startServer = async () => {
    if (config.onBeforeStart) {
      await config.onBeforeStart()
    }

    serve({
      fetch: app.fetch,
      port: config.port,
    })

    console.log(`${config.name} running on port ${config.port}`)
  }

  return {
    app,
    kvStore,
    startServer,
  }
}

export type ServiceApp<
  TBindings extends object = Record<string, unknown>,
  TVariables extends object = Record<string, unknown>,
> = OpenAPIHono<{
  Bindings: TBindings
  Variables: TVariables
}>

export type ServiceContext<
  TBindings extends object = Record<string, unknown>,
  TVariables extends object = Record<string, unknown>,
> = Context<{
  Bindings: TBindings
  Variables: TVariables
}>
