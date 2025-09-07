import type { FastifyInstance } from "fastify"
import { BASE_PATH } from "@/lib/constants"
import healthcheckRoutes from "@/routes/healthcheck"
import commentsRoute from "./comments"

export const routes = async (app: FastifyInstance) => {
  await app.register(healthcheckRoutes, { prefix: `${BASE_PATH}/healthcheck` })
  await app.register(commentsRoute, { prefix: BASE_PATH })
}
