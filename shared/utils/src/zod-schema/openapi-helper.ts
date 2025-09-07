import type { ZodTypeAny } from "zod"

/**
 * Helper function to add OpenAPI metadata to Zod schemas
 * This replaces the  method that was specific to @hono/zod-openapi
 * In Fastify, we'll handle OpenAPI documentation differently
 */
export function withOpenApi<T extends ZodTypeAny>(
  schema: T,
  _metadata?: any
): T {
  // For now, we just return the schema as-is
  // OpenAPI metadata will be handled at the route level in Fastify
  return schema
}

/**
 * Helper function to create route definitions for OpenAPI documentation
 * This replaces the createRoute function from @hono/zod-openapi for Fastify
 */
export interface RouteConfig {
  method: "get" | "post" | "put" | "delete" | "patch" | "options" | "head"
  path: string
  security?: Record<string, string[]>[]
  summary?: string
  description?: string
  tags?: string[]
  request?: {
    body?: {
      content: Record<
        string,
        {
          schema: any
        }
      >
      description?: string
    }
    query?: any
    params?: any
  }
  responses: Record<
    number,
    {
      content: Record<
        string,
        {
          schema: any
        }
      >
      description: string
    }
  >
}

export function createRoute(config: RouteConfig): RouteConfig {
  // For Fastify, we just return the config as-is
  // The actual OpenAPI registration will happen at the route registration level
  return config
}
