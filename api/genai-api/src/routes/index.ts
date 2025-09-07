import type { FastifyInstance } from "fastify"
import { BASE_PATH } from "@/lib/constants"
import genaiRoutes from "@/routes/genai"
import healthcheckRoutes from "@/routes/healthcheck"
import templateRoutes from "./templates"

export const routes = async (app: FastifyInstance) => {
  await app.register(healthcheckRoutes, { prefix: `${BASE_PATH}/healthcheck` })
  await app.register(templateRoutes, { prefix: `${BASE_PATH}/templates` })
  await app.register(genaiRoutes, { prefix: BASE_PATH })
}
