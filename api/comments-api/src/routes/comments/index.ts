import type { FastifyInstance } from "fastify"

export const setupCommentsRoutes = async (app: FastifyInstance) => {
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
    async (request, _reply) => {
      const { projectId } = request.params as { projectId: string }
      // TODO: Implement project comments logic
      return [
        {
          id: "1",
          content: `Sample comment for project ${projectId}`,
          createdAt: new Date().toISOString(),
          authorId: "user1",
        },
      ]
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
    async (request, _reply) => {
      const { taskId } = request.params as { taskId: string }
      // TODO: Implement task comments logic
      return [
        {
          id: "1",
          content: `Sample comment for task ${taskId}`,
          createdAt: new Date().toISOString(),
          authorId: "user1",
        },
      ]
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
    async (request, reply) => {
      const { content } = request.body as { content: string }
      // TODO: Implement add comment logic
      const comment = {
        id: "new-comment-id",
        content,
        createdAt: new Date().toISOString(),
        authorId: "current-user",
      }
      return reply.code(201).send(comment)
    }
  )
}
