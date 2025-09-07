import type { FastifyInstance } from "fastify"
import { BASE_PATH } from "@/lib/constants"
import authRoutes from "@/routes/auth"
import emailVerificationRoutes from "@/routes/email-verification"
import healthcheckRoutes from "@/routes/healthcheck"
import oAuthRoutes from "@/routes/oauth"
import resetPasswordRoutes from "@/routes/reset-password"
import usersRoutes from "./users"

export const routes = async (app: FastifyInstance) => {
  await app.register(authRoutes, { prefix: BASE_PATH })
  await app.register(healthcheckRoutes, { prefix: `${BASE_PATH}/healthcheck` })
  await app.register(resetPasswordRoutes, {
    prefix: `${BASE_PATH}/reset-password`,
  })
  await app.register(emailVerificationRoutes, {
    prefix: `${BASE_PATH}/verification-email`,
  })
  await app.register(oAuthRoutes, { prefix: `${BASE_PATH}/google` })
  await app.register(usersRoutes, { prefix: `${BASE_PATH}/users` })
}
