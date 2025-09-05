import { apiReference } from "@scalar/hono-api-reference"
import type { Env } from "hono"
import type { AjvOpenApiHono } from "../openapi/ajv-openapi"

export function setupOpenApi<T extends Env>(
  app: AjvOpenApiHono<T>,
  basePath: string,
  title?: string,
  description?: string
) {
  app.doc(`${basePath}/openapi.json`, {
    title: title ?? "Open Api Docs",
    version: "1.0.0",
    ...(description ? { description } : {}),
  })

  app.get(
    `${basePath}/reference`,
    apiReference({
      spec: {
        url: `${basePath}/openapi.json`,
      },
    })
  )
}
