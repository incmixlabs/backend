import type { FastifyCorsOptions } from "@fastify/cors"
import cors from "@fastify/cors"
import type { FastifyInstance } from "fastify"
import { envVars } from "@/env-config"

export type CorsOptions = FastifyCorsOptions

const allowedOrigins = [
  "http://localhost:1420",
  "http://localhost:5500",
  "http://localhost:6006",
  "http://localhost:1421",
  "http://localhost:8282",
]

const frontendDomain = "turbo-mix.pages.dev"
const storybookDomain = "turbo-mix-ui.pages.dev"

export async function registerCorsPlugin(
  fastify: FastifyInstance,
  options: CorsOptions = {}
) {
  const {
    origin = (origin, cb) => {
      const DOMAIN = envVars.DOMAIN
      if (!DOMAIN || !origin) {
        return cb(null, false)
      }
      if (DOMAIN === "localhost") {
        return cb(null, true)
      }
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(DOMAIN) ||
        origin.endsWith(frontendDomain) ||
        origin.endsWith(storybookDomain)
      )
        return cb(null, true)

      return cb(null, false)
    },
    credentials = true,
    methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders = ["Content-Type", "Authorization"],
    exposedHeaders = [],
    maxAge = 86400,
    preflightContinue = false,
    optionsSuccessStatus = 204,
  } = options

  await fastify.register(cors, {
    origin,
    credentials,
    methods,
    allowedHeaders,
    exposedHeaders,
    maxAge,
    preflightContinue,
    optionsSuccessStatus,
  })
}
