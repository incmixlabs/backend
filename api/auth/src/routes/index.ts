import { BASE_PATH } from "@/lib/constants"
import authRoutes from "@/routes/auth"
import emailVerificationRoutes from "@/routes/email-verification"
import healthcheckRoutes from "@/routes/healthcheck"
import oAuthRoutes from "@/routes/oauth"
import resetPasswordRoutes from "@/routes/reset-password"
import type { HonoApp } from "@/types"
import type { OpenAPIHono } from "@hono/zod-openapi"
import userRoutes from "./users"

export const routes = (app: OpenAPIHono<HonoApp>) => {
  app.route(`${BASE_PATH}`, authRoutes)
  app.route(`${BASE_PATH}/healthcheck`, healthcheckRoutes)
  app.route(`${BASE_PATH}/reset-password`, resetPasswordRoutes)
  app.route(`${BASE_PATH}/verification-email`, emailVerificationRoutes)
  app.route(`${BASE_PATH}/google`, oAuthRoutes)
  app.route(`${BASE_PATH}/users`, userRoutes)
}
