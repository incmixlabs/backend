import type { FastifyInstance } from "fastify"
import { BASE_PATH } from "@/lib/constants"
import localeRoutes from "@/routes/locales"
import messageRoutes from "@/routes/messages"
import healthcheckRoutes from "./healthcheck"

export const routes = (app: FastifyInstance) => {
  app.register(healthcheckRoutes, { prefix: `${BASE_PATH}/healthcheck` })
  app.register(localeRoutes, { prefix: `${BASE_PATH}/locales` })
  app.register(messageRoutes, { prefix: `${BASE_PATH}/messages` })
}
