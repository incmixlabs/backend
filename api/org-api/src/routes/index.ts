import { BASE_PATH } from "@/lib/constants"
import orgRoutes from "@/routes/organisations"
import type { HonoApp } from "@/types"
import type { OpenAPIHono } from "@hono/zod-openapi"
import healthcheckRoutes from "./health-check"

export const routes = (app: OpenAPIHono<HonoApp>) => {
  app.route(`${BASE_PATH}/healthcheck`, healthcheckRoutes)
  app.route(BASE_PATH, orgRoutes)
  // Permissions and roles routes are removed from main org API
  // They have their own dedicated OpenAPI documentation at /api/org/permissions/reference
}
