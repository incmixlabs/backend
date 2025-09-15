import { ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import {
  errorResponseSchema,
  UnauthorizedError,
} from "@incmix-api/utils/errors"
import {
  getDb,
  sendProcessError,
  streamSSE,
} from "@incmix-api/utils/fastify-bootstrap"
import { useTranslation } from "@incmix-api/utils/middleware"
import type { FastifyInstance, FastifyRequest } from "fastify"
import { FigmaService } from "@/lib/figma"
import {
  generateMultipleUserStories as aiGenerateMultipleUserStories,
  generateProject as aiGenerateProject,
  generateProjectHierarchy as aiGenerateProjectHierarchy,
  generateUserStory as aiGenerateUserStory,
  generateUserStoryFromImage,
} from "@/lib/services"

import {
  figmaSchema,
  generateCodeFromFigmaSchema,
  generateMultipleUserStoriesSchema,
  generateProjectHierarchySchema,
  generateUserStorySchema,
  getFigmaImageResponseSchema,
  getFigmaImageSchema,
  multipleUserStoriesResponseSchema,
  sseCodeDataSchema,
  sseDataSchema,
  userStoryResponseSchema,
} from "./schemas"

export const setupGenaiRoutes = (app: FastifyInstance) => {
  app.post(
    "/generate-project",
    {
      schema: {
        description:
          "Generate a project description, checklist, milestones, initial tasks",
        tags: ["Project"],
        security: [{ cookieAuth: [] }],
        body: generateUserStorySchema,
        response: {
          200: {
            description: "Returns the generated user story in markdown format",
            content: {
              "text/event-stream": {
                schema: sseDataSchema,
              },
            },
          },
          400: {
            description: "Error response when user story generation fails",
            ...errorResponseSchema,
          },
          401: {
            description: "Error response when not authenticated",
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

        const { prompt, userTier, templateId } = request.body as any

        const template = await getDb(request)
          .selectFrom("storyTemplates")
          .selectAll()
          .where("id", "=", templateId)
          .executeTakeFirst()

        return streamSSE(reply, async (stream) => {
          const result = aiGenerateProject(
            request as any,
            prompt,
            template,
            userTier
          )
          for await (const chunk of result.partialObjectStream) {
            await stream.writeSSE({
              data: JSON.stringify(chunk),
            })
          }
          stream.close()
        })
      } catch (error) {
        return await sendProcessError(request, reply, error, [
          "{{ default }}",
          "generate-user-story",
        ])
      }
    }
  )

  app.post(
    "/generate-project-hierarchy",
    {
      schema: {
        description:
          "Generate comprehensive project hierarchy with epics, features, and user stories from a project description",
        tags: ["Project"],
        security: [{ cookieAuth: [] }],
        body: generateProjectHierarchySchema,
        response: {
          200: {
            description:
              "Streams the generated project hierarchy with epics, features, and stories",
            content: {
              "text/event-stream": {
                schema: sseDataSchema,
              },
            },
          },
          400: {
            description:
              "Error response when project hierarchy generation fails",
            ...errorResponseSchema,
          },
          401: {
            description: "Error response when not authenticated",
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

        const { projectDescription, userTier, templateId } = request.body as any

        let template: any
        if (templateId) {
          template = await getDb(request)
            .selectFrom("storyTemplates")
            .selectAll()
            .where("id", "=", templateId)
            .executeTakeFirst()
        }

        return streamSSE(reply, async (stream) => {
          try {
            const result = aiGenerateProjectHierarchy(
              request as any,
              projectDescription,
              template,
              userTier
            )
            for await (const chunk of result.partialObjectStream) {
              await stream.writeSSE({
                data: JSON.stringify(chunk),
              })
            }
            stream.close()
          } catch (_error) {
            await stream.writeSSE({
              event: "error",
              data: JSON.stringify({ error: "Stream processing failed" }),
            })
            stream.close()
          }
        })
      } catch (error) {
        return await sendProcessError(request, reply, error, [
          "{{ default }}",
          "generate-project-hierarchy",
        ])
      }
    }
  )

  app.post(
    "/generate-user-story",
    {
      schema: {
        description:
          "Generate a user story from a prompt using AI (Claude for paid users, Gemini for free)",
        tags: ["Tasks"],
        security: [{ cookieAuth: [] }],
        body: generateUserStorySchema,
        response: {
          200: {
            description: "Returns the generated user story in markdown format",
            content: {
              "text/event-stream": {
                schema: sseDataSchema,
              },
            },
          },
          400: {
            description: "Error response when user story generation fails",
            ...errorResponseSchema,
          },
          401: {
            description: "Error response when not authenticated",
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

        const { prompt, userTier, templateId } = request.body as any

        const template = await getDb(request)
          .selectFrom("storyTemplates")
          .selectAll()
          .where("id", "=", templateId)
          .executeTakeFirst()

        return streamSSE(reply, async (stream) => {
          const result = aiGenerateUserStory(prompt, template, userTier)
          for await (const chunk of result.partialObjectStream) {
            await stream.writeSSE({
              data: JSON.stringify(chunk),
            })
          }
          stream.close()
        })
      } catch (error) {
        return await sendProcessError(request, reply, error, [
          "{{ default }}",
          "generate-user-story",
        ])
      }
    }
  )

  app.post(
    "/generate/figma",
    {
      schema: {
        description:
          "Generate a task from Figma URL using AI (Claude for paid users, Gemini for free)",
        tags: ["Tasks"],
        security: [{ cookieAuth: [] }],
        body: figmaSchema,
        response: {
          200: {
            description: "Returns the generated Story",
            ...userStoryResponseSchema,
          },
          400: {
            description: "Error response when task generation fails",
            ...errorResponseSchema,
          },
          401: {
            description: "Error response when not authenticated",
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

        const { url, prompt, userTier, templateId } = request.body as any
        const figmaService = new FigmaService()
        const figmaImage = await figmaService.getFigmaImage(url)

        const template = await getDb(request)
          .selectFrom("storyTemplates")
          .selectAll()
          .where("id", "=", templateId)
          .executeTakeFirst()

        const userStory = await generateUserStoryFromImage(
          figmaImage,
          prompt,
          userTier,
          template
        )

        return reply.code(200).send({ ...userStory, imageUrl: figmaImage })
      } catch (error) {
        return await sendProcessError(request, reply, error, [
          "{{ default }}",
          "generate-user-story-from-figma",
        ])
      }
    }
  )

  app.post(
    "/generate/code",
    {
      schema: {
        description:
          "Generate production-ready code from Figma designs with advanced features",
        tags: ["Code Generation"],
        security: [{ cookieAuth: [] }],
        body: generateCodeFromFigmaSchema,
        response: {
          200: {
            description: "Streams generated code with status updates",
            content: {
              "text/event-stream": {
                schema: sseCodeDataSchema,
              },
            },
          },
          400: {
            description: "Error response when code generation fails",
            ...errorResponseSchema,
          },
          401: {
            description: "Error response when not authenticated",
            ...errorResponseSchema,
          },
          413: {
            description:
              "Design data too large - consider using a smaller design or specific node",
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

        const {
          url,
          userTier,
          framework,
          styling,
          typescript,
          responsive,
          accessibility,
          componentLibrary,
        } = request.body as any

        const figmaService = new FigmaService()

        // Create code generation options
        const options = {
          framework,
          styling,
          typescript,
          responsive,
          accessibility,
          componentLibrary,
        }

        const result = await figmaService.generateReactFromFigma(
          url,
          userTier,
          options
        )

        return streamSSE(reply, async (stream) => {
          try {
            for await (const chunk of result.partialObjectStream) {
              await stream.writeSSE({
                data: JSON.stringify(chunk),
              })
            }
            stream.close()
          } catch (_error) {
            await stream.writeSSE({
              event: "error",
              data: JSON.stringify({ error: "Stream processing failed" }),
            })
            stream.close()
          }
        })
      } catch (error) {
        return await sendProcessError(request, reply, error, [
          "{{ default }}",
          "generate-code-from-figma",
        ])
      }
    }
  )

  app.post(
    "/get-figma-image",
    {
      schema: {
        description: "Get Figma Image",
        tags: ["Tasks"],
        security: [{ cookieAuth: [] }],
        body: getFigmaImageSchema,
        response: {
          200: {
            description: "Returns the generated image",
            ...getFigmaImageResponseSchema,
          },
          400: {
            description: "Error response when image generation fails",
            ...errorResponseSchema,
          },
          401: {
            description: "Error response when not authenticated",
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

        const { url } = request.body as any
        const figmaService = new FigmaService()
        const figmaImage = await figmaService.getFigmaImage(url)
        return reply.code(200).send({ image: figmaImage })
      } catch (error) {
        return await sendProcessError(request, reply, error, [
          "{{ default }}",
          "get-figma-image",
        ])
      }
    }
  )

  app.post(
    "/generate-multiple-user-stories",
    {
      schema: {
        description:
          "Generate 3 user stories from project description, success criteria, and checklist using AI (Claude for paid users, Gemini for free)",
        tags: ["Tasks"],
        security: [{ cookieAuth: [] }],
        body: generateMultipleUserStoriesSchema,
        response: {
          200: {
            description: "Returns an array of 3 generated user stories",
            ...multipleUserStoriesResponseSchema,
          },
          400: {
            description: "Error response when user story generation fails",
            ...errorResponseSchema,
          },
          401: {
            description: "Error response when not authenticated",
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

        const {
          description,
          successCriteria,
          checklist,
          userTier,
          templateId,
        } = request.body as any

        const template = await getDb(request)
          .selectFrom("storyTemplates")
          .selectAll()
          .where("id", "=", templateId)
          .executeTakeFirst()

        const userStories = await aiGenerateMultipleUserStories(
          request as any,
          description,
          successCriteria,
          checklist,
          userTier,
          template
        )

        return reply.code(200).send({ userStories })
      } catch (error) {
        return await sendProcessError(request, reply, error, [
          "{{ default }}",
          "generate-multiple-user-stories",
        ])
      }
    }
  )
}
