import type { OpenAPIHono } from "@hono/zod-openapi"
import { BASE_PATH } from "@/lib/constants"
import localeRoutes from "@/routes/locales"
import messageRoutes from "@/routes/messages"
import type { HonoApp } from "@/types"
import healthcheckRoutes from "./healthcheck"

export const routes = (app: OpenAPIHono<HonoApp>) => {
  app.route(`${BASE_PATH}/locales`, localeRoutes)
  app.route(`${BASE_PATH}/messages`, messageRoutes)
  app.route(`${BASE_PATH}/healthcheck`, healthcheckRoutes)
}
