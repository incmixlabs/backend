import type { FastifyReply, FastifyRequest } from "fastify"

export interface CorsOptions {
  origin?: string | string[] | boolean
  credentials?: boolean
  methods?: string[]
  allowedHeaders?: string[]
  exposedHeaders?: string[]
  maxAge?: number
}

export function createCorsMiddleware(options: CorsOptions = {}) {
  const {
    origin = "*",
    credentials = false,
    methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders = ["Content-Type", "Authorization"],
    exposedHeaders = [],
    maxAge = 86400,
  } = options

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const requestOrigin = request.headers.origin

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      reply.header("Access-Control-Allow-Methods", methods.join(", "))
      reply.header("Access-Control-Allow-Headers", allowedHeaders.join(", "))
      reply.header("Access-Control-Max-Age", maxAge.toString())

      if (credentials) {
        reply.header("Access-Control-Allow-Credentials", "true")
      }

      if (typeof origin === "string") {
        reply.header("Access-Control-Allow-Origin", origin)
      } else if (Array.isArray(origin)) {
        if (requestOrigin && origin.includes(requestOrigin)) {
          reply.header("Access-Control-Allow-Origin", requestOrigin)
        }
      } else if (origin === true) {
        if (credentials) {
          // When credentials are enabled, we cannot use wildcard origin
          // Only set origin if one is provided in the request
          if (requestOrigin) {
            reply.header("Access-Control-Allow-Origin", requestOrigin)
          }
        } else {
          reply.header("Access-Control-Allow-Origin", requestOrigin || "*")
        }
      }

      return reply.status(204).send()
    }

    // Handle actual requests
    if (typeof origin === "string") {
      reply.header("Access-Control-Allow-Origin", origin)
    } else if (Array.isArray(origin)) {
      if (requestOrigin && origin.includes(requestOrigin)) {
        reply.header("Access-Control-Allow-Origin", requestOrigin)
      }
    } else if (origin === true) {
      if (credentials) {
        // When credentials are enabled, we cannot use wildcard origin
        // Only set origin if one is provided in the request
        if (requestOrigin) {
          reply.header("Access-Control-Allow-Origin", requestOrigin)
        }
      } else {
        reply.header("Access-Control-Allow-Origin", requestOrigin || "*")
      }
    }

    if (credentials) {
      reply.header("Access-Control-Allow-Credentials", "true")
    }

    if (exposedHeaders.length > 0) {
      reply.header("Access-Control-Expose-Headers", exposedHeaders.join(", "))
    }
  }
}
