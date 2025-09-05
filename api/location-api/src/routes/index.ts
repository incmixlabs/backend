import type { AjvOpenApiHono } from "@incmix-api/utils/openapi/ajv-openapi"
import { BASE_PATH } from "@/lib/constants"
import type { HonoApp } from "@/types"
import healthcheckRoutes from "./healthcheck"
import newsRoutes from "./news"
import rateLimitRoutes from "./rate-limits"
import weatherRoutes from "./weather"

export const routes = (app: AjvOpenApiHono<HonoApp>) => {
  app.route(`${BASE_PATH}/weather`, weatherRoutes)
  app.route(`${BASE_PATH}/news`, newsRoutes)
  app.route(`${BASE_PATH}/rate-limits`, rateLimitRoutes)
  app.route(`${BASE_PATH}/healthcheck`, healthcheckRoutes)
}
