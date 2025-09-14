import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { nanoid } from "nanoid"
import {
  getCommentById,
  getProjectById,
  getTaskById,
  listProjectComments,
  listTaskComments,
} from "@/lib/db"

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string
    email: string
    isSuperAdmin: boolean
    emailVerified: boolean
  }
  context?: {
    db?: any
    [key: string]: any
  }
}

// Create a context wrapper that matches what the db functions expect
function createContext(request: AuthenticatedRequest) {
  return {
    get(key: string) {
      if (key === "db" && request.context?.db) {
        return request.context.db
      }
      if (key === "user") {
        return request.user
      }
      return undefined
    },
  }
}

export const setupCommentsRoutes = (app: FastifyInstance): void => {
  // Get comments for a project
  app.get(
    "/projects/:projectId/comments",
    {
      schema: {
        description: "Get project comments",
        tags: ["comments"],
        params: {
          type: "object",
          properties: {
            projectId: { type: "string" },
          },
          required: ["projectId"],
        },
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                content: { type: "string" },
                createdAt: { type: "string" },
                authorId: { type: "string" },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { projectId } = request.params as { projectId: string }
      const authRequest = request as AuthenticatedRequest

      if (!authRequest.user) {
        return reply.code(401).send({ message: "Unauthorized" })
      }

      const context = createContext(authRequest)
      const existingProject = await getProjectById(context as any, projectId)

      if (!existingProject) {
        return reply.code(404).send({ message: "Project not found" })
      }

      const comments = await listProjectComments(context as any, projectId)
      return comments
    }
  )

  // Get comments for a task
  app.get(
    "/tasks/:taskId/comments",
    {
      schema: {
        description: "Get task comments",
        tags: ["comments"],
        params: {
          type: "object",
          properties: {
            taskId: { type: "string" },
          },
          required: ["taskId"],
        },
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                content: { type: "string" },
                createdAt: { type: "string" },
                authorId: { type: "string" },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { taskId } = request.params as { taskId: string }
      const authRequest = request as AuthenticatedRequest

      if (!authRequest.user) {
        return reply.code(401).send({ message: "Unauthorized" })
      }

      const context = createContext(authRequest)
      const existingTask = await getTaskById(context as any, taskId)

      if (!existingTask) {
        return reply.code(404).send({ message: "Task not found" })
      }

      const comments = await listTaskComments(context as any, taskId)
      return comments
    }
  )

  // Add a comment
  app.post(
    "/comments",
    {
      schema: {
        description: "Add a comment",
        tags: ["comments"],
        body: {
          type: "object",
          properties: {
            content: { type: "string", minLength: 1 },
            projectId: { type: "string" },
            taskId: { type: "string" },
          },
          required: ["content"],
          additionalProperties: false,
        },
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "string" },
              content: { type: "string" },
              createdAt: { type: "string" },
              authorId: { type: "string" },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authRequest = request as AuthenticatedRequest
      if (!authRequest.user) {
        return reply.code(401).send({ message: "Unauthorized" })
      }

      const { content, projectId, taskId } = request.body as {
        content: string
        projectId?: string
        taskId?: string
      }

      const commentId = nanoid()
      const now = new Date()
      const context = createContext(authRequest)
      const db = authRequest.context?.db

      if (!db) {
        return reply.code(500).send({ message: "Database not available" })
      }

      try {
        await db.transaction().execute(async (trx: any) => {
          // Insert the comment
          await trx
            .insertInto("comments")
            .values({
              id: commentId,
              content,
              createdBy: authRequest.user?.id || "",
              createdAt: now,
            })
            .execute()

          // Associate with project or task if provided
          if (projectId) {
            const project = await getProjectById(context as any, projectId)
            if (!project) {
              throw new Error("Project not found")
            }

            await trx
              .insertInto("projectComments")
              .values({
                projectId,
                commentId,
              })
              .execute()
          }

          if (taskId) {
            const task = await getTaskById(context as any, taskId)
            if (!task) {
              throw new Error("Task not found")
            }

            await trx
              .insertInto("taskComments")
              .values({
                taskId,
                commentId,
              })
              .execute()
          }
        })

        // Fetch the created comment with user details
        const createdComment = await getCommentById(context as any, commentId)

        if (!createdComment) {
          return reply.code(500).send({ message: "Failed to create comment" })
        }

        return reply.code(201).send(createdComment)
      } catch (error: any) {
        if (error.message === "Project not found") {
          return reply.code(404).send({ message: "Project not found" })
        }
        if (error.message === "Task not found") {
          return reply.code(404).send({ message: "Task not found" })
        }
        return reply.code(500).send({ message: "Failed to create comment" })
      }
    }
  )
}
