import type { OpenAPIHono } from "@hono/zod-openapi"
import { BASE_PATH } from "@/lib/constants"
import type { HonoApp } from "@/types"
import healthcheckRoutes from "./healthcheck"
import newsRoutes from "./news"
import rateLimitRoutes from "./rate-limits"
import weatherRoutes from "./weather"

console.log("BASE_PATH", BASE_PATH)
export const routes = (app: OpenAPIHono<HonoApp>) => {
  app.route(`${BASE_PATH}/weather`, weatherRoutes)
  app.route(`${BASE_PATH}/news`, newsRoutes)
  app.route(`${BASE_PATH}/rate-limits`, rateLimitRoutes)
  app.route(`${BASE_PATH}/healthcheck`, healthcheckRoutes)
}
