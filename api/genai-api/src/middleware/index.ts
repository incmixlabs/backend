import type { FastifyInstance } from "fastify"
// import { setupApiMiddleware } from "@incmix-api/utils/middleware"
// import { BASE_PATH } from "@/lib/constants"

// TODO: Update setupApiMiddleware to support Fastify or implement Fastify-specific middleware
export const middlewares = (app: FastifyInstance) => {
  // setupApiMiddleware(app, {
  //   basePath: BASE_PATH,
  //   serviceName: "genai-api",
  //   corsFirst: true,
  // })
  console.log("Middleware setup placeholder - app:", !!app)
}
