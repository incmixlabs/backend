import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import {
  ConflictError,
  processError,
  UnauthorizedError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import type { FastifyInstance, FastifyRequest } from "fastify"
import { ERROR_TEMPLATE_ALREADY_EXISTS } from "@/lib/constants"
import { generateTemplate } from "@/lib/services"
import {
  errorResponseSchema,
  generateStoryTemplateResponseSchema,
  generateStoryTemplateSchema,
  newStoryTemplateSchema,
  storyTemplateArraySchema,
  storyTemplateSchema,
} from "./schemas"

const getDb = (request: FastifyRequest) => {
  if (!request.context?.db) {
    throw new Error("Database not available")
  }
  return request.context.db
}

export const setupTemplateRoutes = async (app: FastifyInstance) => {
  // Get all story templates
  app.get(
    "",
    {
      schema: {
        description: "Get all story templates",
        tags: ["Templates"],
        response: {
          200: {
            description: "Success",
            ...storyTemplateArraySchema,
          },
          401: {
            description: "Unauthorized",
            ...errorResponseSchema,
          },
          403: {
            description: "Forbidden",
            ...errorResponseSchema,
          },
          500: {
            description: "Internal Server Error",
            ...errorResponseSchema,
          },
        },
      },
    },
    async (request: FastifyRequest, reply) => {
      try {
        const user = request.user
        const t = await useTranslation(request as any)
        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }
        const storyTemplates = await getDb(request)
          .selectFrom("storyTemplates")
          .selectAll()
          .execute()
        return reply.code(200).send(storyTemplates)
      } catch (error) {
        return await processError(request as any, error)
      }
    }
  )

  // Generate a story template
  app.post(
    "/generate",
    {
      schema: {
        description: "Generate a story template",
        tags: ["Templates"],
        body: generateStoryTemplateSchema,
        response: {
          200: {
            description: "Success",
            ...generateStoryTemplateResponseSchema,
          },
          401: {
            description: "Unauthorized",
            ...errorResponseSchema,
          },
          500: {
            description: "Internal Server Error",
            ...errorResponseSchema,
          },
        },
      },
    },
    async (request: FastifyRequest, reply) => {
      try {
        const user = request.user
        const t = await useTranslation(request as any)
        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        const { prompt, userTier, format } = request.body as any
        const template = await generateTemplate(
          request as any,
          prompt,
          userTier,
          format
        )
        return reply.code(200).send({ template })
      } catch (error) {
        return await processError(request as any, error)
      }
    }
  )

  // Insert a new story template
  app.post(
    "/insert",
    {
      schema: {
        description: "Insert a story template",
        tags: ["Templates"],
        body: newStoryTemplateSchema,
        response: {
          201: {
            description: "Success",
            ...storyTemplateSchema,
          },
          401: {
            description: "Unauthorized",
            ...errorResponseSchema,
          },
          409: {
            description: "Conflict",
            ...errorResponseSchema,
          },
          500: {
            description: "Internal Server Error",
            ...errorResponseSchema,
          },
        },
      },
    },
    async (request: FastifyRequest, reply) => {
      try {
        const user = request.user
        const t = await useTranslation(request as any)
        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }
        const { name, content } = request.body as any

        const existingTemplate = await getDb(request)
          .selectFrom("storyTemplates")
          .selectAll()
          .where("name", "=", name)
          .executeTakeFirst()

        if (existingTemplate) {
          const msg = await t.text(ERROR_TEMPLATE_ALREADY_EXISTS)
          throw new ConflictError(msg)
        }

        const template = await getDb(request)
          .insertInto("storyTemplates")
          .values({
            name,
            content,
            createdBy: user.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .returningAll()
          .executeTakeFirstOrThrow()
        return reply.code(201).send(template)
      } catch (error) {
        return await processError(request as any, error)
      }
    }
  )
}
