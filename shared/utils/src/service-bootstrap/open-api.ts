import type { OpenAPIHono } from "@hono/zod-openapi"
import { apiReference } from "@scalar/hono-api-reference"
import type { Env } from "hono"

export function setupOpenApi<T extends Env>(
  app: OpenAPIHono<T>,
  basePath: string,
  title?: string,
  description?: string
) {
  app.doc(`${basePath}/openapi.json`, {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: title ?? "Open Api Docs",
      description: description,
    },
  })

  app.get(
    `${basePath}/reference`,
    apiReference({
      spec: {
        url: `${basePath}/openapi.json`,
      },
    })
  )

  app.openAPIRegistry.registerComponent("securitySchemes", "cookieAuth", {
    type: "apiKey",
    in: "cookie",
    name: "session",
  })
}
