import type { FastifyInstance } from "fastify"

export const setupMiddleware = async (_app: FastifyInstance) => {
  // TODO: Setup middleware for intl-api
  // This might include CORS, authentication, logging, etc.
  // For now, intl-api has skipAuth: true, so minimal middleware needed
}
