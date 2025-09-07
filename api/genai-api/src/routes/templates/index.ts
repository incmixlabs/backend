import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import {
  ConflictError,
  processError,
  UnauthorizedError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { z } from "zod"
import { ERROR_TEMPLATE_ALREADY_EXISTS } from "@/lib/constants"
import { generateTemplate } from "@/lib/services"

// Schema for generate template request
const _generateTemplateSchema = z.object({
  prompt: z.string(),
  userTier: z.enum(["free", "paid"]),
  format: z.enum(["markdown", "html", "plainText"]),
})

export default function templateRoutes(fastify: FastifyInstance) {
  // Get story templates
  const getSchema = {
    tags: ["Templates"],
    summary: "Get story templates",
    description: "Get all story templates",
    response: {
      200: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "number" },
            name: { type: "string" },
            content: { type: "string" },
            createdAt: { type: "string" },
            updatedAt: { type: "string" },
            createdBy: { type: "string" },
          },
          required: ["id", "name", "content", "createdAt", "updatedAt"],
        },
      },
    },
  }

  fastify.get(
    "/",
    { schema: getSchema },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as any).user
        const t = await useTranslation(request)
        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }
        const db = (request as any).db
        const storyTemplates = await db
          .selectFrom("storyTemplates")
          .selectAll()
          .execute()
        return reply.send(storyTemplates)
      } catch (error) {
        return await processError(request, reply, error)
      }
    }
  )

  // Generate story template
  const generateSchema = {
    tags: ["Templates"],
    summary: "Generate story template",
    description: "Generate a story template",
    body: {
      type: "object",
      properties: {
        prompt: { type: "string" },
        userTier: { type: "string", enum: ["free", "paid"] },
        format: { type: "string", enum: ["markdown", "html", "plainText"] },
      },
      required: ["prompt", "userTier", "format"],
    },
    response: {
      200: {
        type: "object",
        properties: {
          template: { type: "string" },
        },
      },
    },
  }

  fastify.post(
    "/generate",
    { schema: generateSchema },
    async (
      request: FastifyRequest<{
        Body: {
          prompt: string
          userTier: "free" | "paid"
          format: "markdown" | "html" | "plainText"
        }
      }>,
      reply: FastifyReply
    ) => {
      try {
        const user = (request as any).user
        const t = await useTranslation(request)
        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        const { prompt, userTier, format } = request.body
        const template = await generateTemplate(
          request,
          prompt,
          userTier,
          format
        )
        return reply.send({ template })
      } catch (error) {
        return await processError(request, reply, error)
      }
    }
  )

  // Insert story template
  const insertSchema = {
    tags: ["Templates"],
    summary: "Insert story template",
    description: "Insert a story template",
    body: {
      type: "object",
      properties: {
        name: { type: "string" },
        content: { type: "string" },
      },
      required: ["name", "content"],
    },
    response: {
      201: {
        type: "object",
        properties: {
          id: { type: "number" },
          name: { type: "string" },
          content: { type: "string" },
          createdAt: { type: "string" },
          updatedAt: { type: "string" },
          createdBy: { type: "string" },
        },
        required: ["id", "name", "content", "createdAt", "updatedAt"],
      },
    },
  }

  fastify.post(
    "/insert",
    { schema: insertSchema },
    async (
      request: FastifyRequest<{ Body: { name: string; content: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const user = (request as any).user
        const t = await useTranslation(request)
        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }
        const { name, content } = request.body
        const db = (request as any).db

        const existingTemplate = await db
          .selectFrom("storyTemplates")
          .selectAll()
          .where("name", "=", name)
          .executeTakeFirst()

        if (existingTemplate) {
          const msg = await t.text(ERROR_TEMPLATE_ALREADY_EXISTS)
          throw new ConflictError(msg)
        }

        const template = await db
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
        return await processError(request, reply, error)
      }
    }
  )
}
