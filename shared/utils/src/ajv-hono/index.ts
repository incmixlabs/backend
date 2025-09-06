import type { Context, MiddlewareHandler } from "hono"
import { Hono } from "hono"
import type { HTTPException } from "hono/http-exception"
import { createValidator } from "../ajv-schema/index"

export interface AjvRoute {
  path: string
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  requestSchema?: any
  responseSchema?: any
  tags?: string[]
  summary?: string
  description?: string
}

export class AjvOpenApiHono extends Hono {
  private ajvRoutes: AjvRoute[] = []

  constructor() {
    super()
  }

  openapi<T = any>(route: AjvRoute, handler: MiddlewareHandler) {
    this.ajvRoutes.push(route)
    
    const middleware: MiddlewareHandler = async (c, next) => {
      // Validate request if schema provided
      if (route.requestSchema) {
        try {
          const validator = createValidator(route.requestSchema)
          let data: any = {}
          
          if (route.method === "GET") {
            data = Object.fromEntries(new URL(c.req.url).searchParams)
          } else {
            const contentType = c.req.header("content-type")
            if (contentType?.includes("application/json")) {
              data = await c.req.json()
            } else if (contentType?.includes("multipart/form-data")) {
              const formData = await c.req.formData()
              data = Object.fromEntries(formData.entries())
            }
          }
          
          validator.parse(data)
          c.set("validatedData", data)
        } catch (error) {
          return c.json({ error: "Validation failed", details: String(error) }, 400)
        }
      }
      
      return handler(c, next)
    }
    
    return middleware
  }

  getRoutes(): AjvRoute[] {
    return this.ajvRoutes
  }

  doc(path: string, config: { info: { title: string; version: string; description?: string } }) {
    return (c: Context) => {
      const openApiSpec = {
        openapi: "3.0.0",
        info: config.info,
        paths: {} as any,
        components: {
          schemas: {},
        },
      }

      // Convert routes to OpenAPI paths
      for (const route of this.ajvRoutes) {
        if (!openApiSpec.paths[route.path]) {
          openApiSpec.paths[route.path] = {}
        }

        openApiSpec.paths[route.path][route.method.toLowerCase()] = {
          summary: route.summary,
          description: route.description,
          tags: route.tags || [],
          requestBody: route.requestSchema ? {
            content: {
              "application/json": {
                schema: route.requestSchema,
              },
            },
          } : undefined,
          responses: {
            "200": {
              description: "Success",
              content: route.responseSchema ? {
                "application/json": {
                  schema: route.responseSchema,
                },
              } : undefined,
            },
            "400": {
              description: "Bad Request",
            },
            "500": {
              description: "Internal Server Error",
            },
          },
        }
      }

      return c.json(openApiSpec)
    }
  }
}

// Helper functions for common validation scenarios
export const jsonValidator = <T>(schema: any): MiddlewareHandler => {
  return async (c, next) => {
    try {
      const validator = createValidator(schema)
      const data = await c.req.json()
      const validated = validator.parse(data)
      c.set("validatedData", validated)
      return next()
    } catch (error) {
      return c.json({ error: "JSON validation failed", details: String(error) }, 400)
    }
  }
}

export const queryValidator = <T>(schema: any): MiddlewareHandler => {
  return async (c, next) => {
    try {
      const validator = createValidator(schema)
      const query = Object.fromEntries(new URL(c.req.url).searchParams)
      const validated = validator.parse(query)
      c.set("validatedQuery", validated)
      return next()
    } catch (error) {
      return c.json({ error: "Query validation failed", details: String(error) }, 400)
    }
  }
}

export const createAjvApp = () => new AjvOpenApiHono()

export * from "../ajv-schema/index"