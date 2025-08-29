import { envVars } from "@/env-vars"
import { BASE_PATH } from "@/lib/constants"
import type { HonoApp } from "@/types"
import type { OpenAPIHono } from "@hono/zod-openapi"
import { setupApiMiddleware } from "@incmix-api/utils/middleware"
import { mockMiddleware } from "./mock"

export const middlewares = (app: OpenAPIHono<HonoApp>) => {
  setupApiMiddleware(app, {
    basePath: BASE_PATH,
    serviceName: "tasks-api",
    databaseUrl: envVars.DATABASE_URL,
    mockMiddleware: mockMiddleware,
    mockData: envVars.MOCK_DATA,
  })
}
