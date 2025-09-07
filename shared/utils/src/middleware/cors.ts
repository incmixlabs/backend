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
      if (!origin) return callback(null, false)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      let host: string
      try {
        host = new URL(origin).hostname
      } catch {
        return callback(null, false)
      }
      if (DOMAIN) {
        if (
          host === DOMAIN ||
          host.endsWith(`.${DOMAIN}`) ||
          host === frontendDomain ||
          host.endsWith(`.${frontendDomain}`) ||
          host === storybookDomain ||
          host.endsWith(`.${storybookDomain}`)
        ) {
          return callback(null, true)
        }
        return callback(null, false)
      }
      if (host === "localhost" || host === "127.0.0.1") {
        return callback(null, true)
      }
      return callback(null, false)
    },
    methods: ["POST", "GET", "OPTIONS", "DELETE", "PUT", "PATCH"],
    credentials: true,
    allowedHeaders: [
      "content-type",
      "accept-language",
      "sentry-trace",
      "baggage",
      "x-client-type",
      "authorization",
      "x-requested-with",
    ],
    exposedHeaders: ["set-cookie", "content-language"],
  })
}
