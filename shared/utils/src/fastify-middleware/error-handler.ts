import type { FastifyError, FastifyReply, FastifyRequest } from "fastify"

export interface ErrorResponse {
  error: string
  message: string
  statusCode: number
  timestamp: string
  path: string
}

export function createErrorHandler() {
  return async (
    error: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    let statusCode = error.statusCode || 500

    // Convert Fastify validation errors (400) to 422 for consistency with API tests
    if (error.statusCode === 400 && error.code === "FST_ERR_VALIDATION") {
      statusCode = 422
    }

    const errorResponse: ErrorResponse = {
      error: error.name || "Internal Server Error",
      message: error.message || "An unexpected error occurred",
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
    }

    // Log error details (you can customize this based on your logging setup)
    console.error({
      error: error.name,
      message: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
      statusCode,
    })

    return reply.status(statusCode).send(errorResponse)
  }
}
