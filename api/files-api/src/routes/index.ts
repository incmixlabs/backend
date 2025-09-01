import { BASE_PATH } from "@/lib/constants"
import filesRoutes from "@/routes/files"
import healthcheckRoutes from "@/routes/healthcheck"
import type { HonoApp } from "@/types"
import type { OpenAPIHono } from "@hono/zod-openapi"

export const routes = (app: OpenAPIHono<HonoApp>) => {
  app.route(BASE_PATH, filesRoutes)
  app.route(`${BASE_PATH}/healthcheck`, healthcheckRoutes)
}
