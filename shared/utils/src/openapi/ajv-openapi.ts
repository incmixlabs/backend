import type { ValidateFunction } from "ajv"
import type { Env } from "hono"
import { Hono } from "hono"

export interface AjvOpenApiRoute {
  path: string
  method: "get" | "post" | "put" | "patch" | "delete"
  summary?: string
  description?: string
  tags?: string[]
  security?: Array<{ [key: string]: string[] }>
  request?: {
    body?: {
      content: {
        "application/json": {
          schema: any
        }
      }
    }
    params?: any
    query?: any
  }
  responses: {
    [statusCode: string]: {
      description: string
      content?: {
        "application/json": {
          schema: any
        }
      }
    }
  }
}

export interface AjvValidationConfig {
  target?: "json" | "query" | "param" | "form"
  onError?: (errors: any[], c: any) => Response
}

export class AjvOpenApiHono<T extends Env = Env> extends Hono<T> {
  private openApiRoutes: AjvOpenApiRoute[] = []
  private title = "API Documentation"
  private version = "1.0.0"
  private description?: string

  setTitle(title: string): this {
    this.title = title
    return this
  }

  setVersion(version: string): this {
    this.version = version
    return this
  }

  setDescription(description: string): this {
    this.description = description
    return this
  }

  openapi<P extends string = any>(
    path: P,
    method: "get" | "post" | "put" | "patch" | "delete",
    config: {
      summary?: string
      description?: string
      tags?: string[]
      security?: Array<{ [key: string]: string[] }>
      request?: {
        body?: {
          validator?: ValidateFunction
          schema: any
          config?: AjvValidationConfig
        }
        params?: any
        query?: {
          validator?: ValidateFunction
          schema: any
          config?: AjvValidationConfig
        }
      }
      responses: {
        [statusCode: string]: {
          description: string
          schema?: any
        }
      }
    },
    handler: any
  ): this {
    // Store route info for OpenAPI generation
    this.openApiRoutes.push({
      path,
      method,
      summary: config.summary,
      description: config.description,
      tags: config.tags,
      security: config.security,
      request: config.request
        ? {
            body: config.request.body
              ? {
                  content: {
                    "application/json": {
                      schema: config.request.body.schema,
                    },
                  },
                }
              : undefined,
            params: config.request.params,
            query: config.request.query?.schema,
          }
        : undefined,
      responses: Object.fromEntries(
        Object.entries(config.responses).map(([status, response]) => [
          status,
          {
            description: response.description,
            content: response.schema
              ? {
                  "application/json": {
                    schema: response.schema,
                  },
                }
              : undefined,
          },
        ])
      ),
    })

    // Add validation middleware if validators are provided
    const middlewares: any[] = []

    if (config.request?.body?.validator) {
      middlewares.push(
        this.createAjvValidator(
          config.request.body.validator,
          config.request.body.config || {}
        )
      )
    }

    if (config.request?.query?.validator) {
      middlewares.push(
        this.createAjvValidator(config.request.query.validator, {
          target: "query",
          ...config.request.query.config,
        })
      )
    }

    // Register the route with Hono
    if (middlewares.length > 0) {
      ;(this as any)[method](path, ...middlewares, handler)
    } else {
      ;(this as any)[method](path, handler)
    }

    return this
  }

  private createAjvValidator(
    validator: ValidateFunction,
    config: AjvValidationConfig
  ) {
    return async (c: any, next: any) => {
      const { target = "json", onError } = config
      let data: unknown

      try {
        switch (target) {
          case "json":
            data = await c.req.json()
            break
          case "query":
            data = c.req.query()
            break
          case "param":
            data = c.req.param()
            break
          case "form":
            data = await c.req.formData()
            break
          default:
            data = await c.req.json()
        }
      } catch (_error) {
        return c.json({ error: "Invalid request body" }, 400)
      }

      const valid = validator(data)

      if (!valid) {
        const errors = validator.errors || []

        if (onError) {
          return onError(errors, c)
        }

        // Default error response
        const formattedErrors = errors.map((error) => ({
          path: error.instancePath
            ? error.instancePath.split("/").filter(Boolean)
            : [error.propertyName || ""].filter(Boolean),
          message: error.message || "Invalid value",
          code: error.keyword || "invalid",
          value: error.data,
        }))

        return c.json(
          {
            error: "Validation failed",
            details: formattedErrors,
          },
          422
        )
      }

      c.set("validatedData", data)
      await next()
    }
  }

  doc(
    path: string,
    info?: { title?: string; version?: string; description?: string }
  ): this {
    const openApiSpec = {
      openapi: "3.0.0",
      info: {
        title: info?.title || this.title,
        version: info?.version || this.version,
        description: info?.description || this.description,
      },
      paths: this.generatePaths(),
      components: {
        securitySchemes: {
          cookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: "session",
          },
        },
      },
    }

    this.get(path, (c) => c.json(openApiSpec))
    return this
  }

  private generatePaths() {
    const paths: any = {}

    for (const route of this.openApiRoutes) {
      if (!paths[route.path]) {
        paths[route.path] = {}
      }

      const operation: any = {
        summary: route.summary,
        description: route.description,
        tags: route.tags,
        security: route.security,
      }

      if (route.request?.body) {
        operation.requestBody = route.request.body
      }

      if (route.request?.query) {
        operation.parameters = Object.entries(
          route.request.query.properties || {}
        ).map(([name, schema]) => ({
          name,
          in: "query",
          schema,
          required: route.request?.query.required?.includes(name) || false,
        }))
      }

      if (route.request?.params) {
        operation.parameters = [
          ...(operation.parameters || []),
          ...Object.entries(route.request.params.properties || {}).map(
            ([name, schema]) => ({
              name,
              in: "path",
              schema,
              required: true,
            })
          ),
        ]
      }

      operation.responses = route.responses

      paths[route.path][route.method] = operation
    }

    return paths
  }
}

// Helper to get validated data from context
export function getValidatedData<T>(c: any): T {
  return c.get("validatedData") as T
}

// Utility function to create a new AjvOpenApiHono instance
export function createAjvOpenApiHono<T extends Env = Env>(): AjvOpenApiHono<T> {
  return new AjvOpenApiHono<T>()
}
