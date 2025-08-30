import fastifyCors from "@fastify/cors"
import type { FastifyInstance } from "fastify"

const allowedOrigins = [
  "http://localhost:1420",
  "http://localhost:5500",
  "http://localhost:6006",
  "http://localhost:1421",
  "http://localhost:8282",
]

const frontendDomain = "turbo-mix.pages.dev"
const storybookDomain = "turbo-mix-ui.pages.dev"

export async function setupCors(app: FastifyInstance, _basePath: string) {
  await app.register(fastifyCors, {
    origin: (origin, callback) => {
      const DOMAIN = process.env.DOMAIN
      if (!DOMAIN) {
        callback(null, false)
        return
      }
      if (DOMAIN === "localhost") {
        callback(null, true)
        return
      }
      if (!origin) {
        callback(null, false)
        return
      }
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(DOMAIN) ||
        origin.endsWith(frontendDomain) ||
        origin.endsWith(storybookDomain)
      ) {
        callback(null, true)
      } else {
        callback(null, false)
      }
    },
    methods: ["POST", "GET", "OPTIONS", "DELETE", "PUT", "PATCH"],
    credentials: true,
    allowedHeaders: [
      "content-type",
      "accept-language",
      "sentry-trace",
      "baggage",
      "x-client-type",
    ],
    exposedHeaders: ["set-cookie", "content-language"],
  })
}
