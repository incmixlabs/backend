import multipart from "@fastify/multipart"
import { defaultSetupMiddleware } from "@incmix-api/utils/fastify-bootstrap"
import type { FastifyInstance } from "fastify"

export const setupMiddleware = async (app: FastifyInstance) => {
  // Register multipart plugin for file uploads
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  })

  // Call the default middleware setup
  defaultSetupMiddleware(app)
}
