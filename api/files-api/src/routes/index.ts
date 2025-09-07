import type { FastifyInstance } from "fastify"
import { BASE_PATH } from "@/lib/constants"
import filesRoutes from "@/routes/files"
import healthcheckRoutes from "@/routes/healthcheck"

export const routes = async (app: FastifyInstance) => {
  await app.register(filesRoutes, { prefix: BASE_PATH })
  await app.register(healthcheckRoutes, { prefix: `${BASE_PATH}/healthcheck` })
}
