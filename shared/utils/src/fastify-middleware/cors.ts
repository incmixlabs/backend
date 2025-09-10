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
        const requestOrigin = request.headers.origin
        if (requestOrigin && origin.includes(requestOrigin)) {
          reply.header("Access-Control-Allow-Origin", requestOrigin)
        }
      } else if (origin === true) {
        reply.header(
          "Access-Control-Allow-Origin",
          request.headers.origin || "*"
        )
      }

      return reply.status(204).send()
    }

    // Handle actual requests
    if (typeof origin === "string") {
      reply.header("Access-Control-Allow-Origin", origin)
    } else if (Array.isArray(origin)) {
      const requestOrigin = request.headers.origin
      if (requestOrigin && origin.includes(requestOrigin)) {
        reply.header("Access-Control-Allow-Origin", requestOrigin)
      }
    } else if (origin === true) {
      reply.header("Access-Control-Allow-Origin", request.headers.origin || "*")
    }

    if (credentials) {
      reply.header("Access-Control-Allow-Credentials", "true")
    }

    if (exposedHeaders.length > 0) {
      reply.header("Access-Control-Expose-Headers", exposedHeaders.join(", "))
    }
  }
}
