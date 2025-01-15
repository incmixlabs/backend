import type { OpenAPIHono } from "@hono/zod-openapi"
import type { Context, Env } from "hono"
import { cors } from "hono/cors"

const allowedOrigins = [
  "http://localhost:1420",
  "http://localhost:6006",
  "http://localhost:1421",
  "http://localhost:8282",
]

const frontendDomain = "turbo-mix.pages.dev"
const storybookDomain = "turbo-mix-ui.pages.dev"

export function setupCors<T extends Env>(
  app: OpenAPIHono<T>,
  basePath: string
) {
  app.use(
    `${basePath}/*`,
    cors({
      origin: (origin, c: Context) => {
        if (
          allowedOrigins.includes(origin) ||
          origin.endsWith(c.env.DOMAIN) ||
          origin.endsWith(frontendDomain) ||
          origin.endsWith(storybookDomain)
        )
          return origin

        return null
      },
      allowMethods: ["POST", "GET", "OPTIONS", "DELETE", "PUT", "PATCH"],
      credentials: true,
      allowHeaders: [
        "content-type",
        "accept-language",
        "sentry-trace",
        "baggage",
        "x-client-type",
      ],
      exposeHeaders: ["set-cookie", "content-language"],
    })
  )
}
