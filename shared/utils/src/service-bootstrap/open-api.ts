import { apiReference } from "@scalar/hono-api-reference"
import type { Env, Hono } from "hono"

export function setupOpenApi<T extends Env>(
  app: Hono<T>,
  basePath: string,
  title?: string,
  description?: string
) {
  app.get(`${basePath}/openapi.json`, (c) => {
    return c.json({
      openapi: "3.0.0",
      info: {
        version: "1.0.0",
        title: title ?? "Open Api Docs",
        ...(description ? { description } : {}),
      },
      paths: {},
      components: { schemas: {} }
    })
  })

  app.get(
    `${basePath}/reference`,
    apiReference({
      spec: {
        url: `${basePath}/openapi.json`,
      },
    })
  )

  // Security schemes are handled in the AJV OpenAPI implementation
}
