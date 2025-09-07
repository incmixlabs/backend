import type { FastifyInstance } from "fastify"
import { BASE_PATH } from "@/lib/constants"
import orgRoutes from "@/routes/organisations"
import featureFlagsRoutes from "./feature-flags"
import healthcheckRoutes from "./health-check"
import permissionRoutes from "./permissions"
import rolesRoutes from "./roles"

export const routes = async (app: FastifyInstance) => {
  await app.register(healthcheckRoutes, { prefix: `${BASE_PATH}/healthcheck` })
  await app.register(permissionRoutes, { prefix: `${BASE_PATH}/permissions` })
  await app.register(orgRoutes, { prefix: BASE_PATH })
  await app.register(featureFlagsRoutes, {
    prefix: `${BASE_PATH}/feature-flags`,
  })
  await app.register(rolesRoutes, { prefix: `${BASE_PATH}/roles` })
}
