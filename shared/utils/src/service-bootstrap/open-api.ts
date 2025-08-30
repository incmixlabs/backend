import fastifySwagger from "@fastify/swagger"
import fastifySwaggerUi from "@fastify/swagger-ui"
import type { FastifyInstance } from "fastify"

export async function setupOpenApi(
  app: FastifyInstance,
  basePath: string,
  title?: string
) {
  await app.register(fastifySwagger, {
    openapi: {
      openapi: "3.0.0",
      info: {
        title: title ?? "Open Api Docs",
        version: "1.0.0",
      },
      servers: [
        {
          url: basePath,
        },
      ],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: "session",
          },
        },
      },
    },
  })

  await app.register(fastifySwaggerUi, {
    routePrefix: `${basePath}/reference`,
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject) => swaggerObject,
    transformSpecificationClone: true,
  })
}
