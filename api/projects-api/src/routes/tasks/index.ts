import type { FastifyInstance } from "fastify"
import {
  addTaskChecklistItem,
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  removeTaskChecklistItems,
  updateTask,
  updateTaskChecklistItem,
} from "@/lib/db"

export const setupTasksRoutes = (app: FastifyInstance) => {
  // List tasks
  app.get(
    "/",
    {
      schema: {
        description: "List all tasks for the current user",
        tags: ["tasks"],
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                description: { type: "string" },
                status: { type: "string" },
                priority: { type: "string" },
                projectId: { type: "string" },
                assignedTo: {
                  type: "array",
                  items: { type: "string" },
                },
                startDate: { type: "string" },
                endDate: { type: "string" },
                completed: { type: "boolean" },
              },
            },
          },
        },
      },
    },
    async (request, _reply) => {
      try {
        // Check if user is authenticated
        if (!request.user?.id) {
          return []
        }

        // Get tasks for the current user
        const tasks = await getTasks(request as any, request.user.id)
        return tasks
      } catch (error) {
        console.error("Error listing tasks:", error)
        return []
      }
    }
  )

  // Create task
  app.post(
    "/",
    {
      schema: {
        description: "Create a new task",
        tags: ["tasks"],
        body: {
          type: "object",
          properties: {
            projectId: { type: "string", minLength: 1 },
            name: { type: "string", minLength: 1 },
            description: { type: "string" },
            taskOrder: { type: "number" },
            assignedTo: {
              type: "array",
              items: { type: "string" },
            },
            startDate: { type: "string" },
            endDate: { type: "string" },
            parentTaskId: { type: "string" },
            statusId: { type: "string" },
            priorityId: { type: "string" },
            labelsTags: { type: "array", items: { type: "string" } },
            refUrls: { type: "array", items: { type: "object" } },
            attachments: { type: "array", items: { type: "object" } },
            acceptanceCriteria: { type: "array", items: { type: "object" } },
            checklist: { type: "array", items: { type: "object" } },
          },
          required: ["projectId", "name"],
          additionalProperties: false,
        },
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // Check if user is authenticated
        if (!request.user?.id) {
          return (reply as any).status(401).send({ error: "Unauthorized" })
        }

        const taskData = request.body as any

        // Create the task
        const result = await createTask(
          request as any,
          taskData,
          request.user.id
        )

        return reply.code(201).send({
          id: result.taskId,
          name: result.name,
          message: result.message,
        })
      } catch (error) {
        console.error("Error creating task:", error)
        return (reply as any)
          .status(500)
          .send({ error: "Failed to create task" })
      }
    }
  )

  // Get task by ID
  app.get(
    "/:taskId",
    {
      schema: {
        description: "Get a task by ID",
        tags: ["tasks"],
        params: {
          type: "object",
          properties: {
            taskId: { type: "string" },
          },
          required: ["taskId"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              description: { type: "string" },
              status: { type: "string" },
              priority: { type: "string" },
              projectId: { type: "string" },
              assignedTo: {
                type: "array",
                items: { type: "string" },
              },
              startDate: { type: "string" },
              endDate: { type: "string" },
              completed: { type: "boolean" },
              comments: {
                type: "array",
                items: { type: "object" },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { taskId } = request.params as { taskId: string }

        // Check if user is authenticated
        if (!request.user?.id) {
          return (reply as any).status(401).send({ error: "Unauthorized" })
        }

        // Get the task
        const task = await getTaskById(request as any, taskId)

        if (!task) {
          return (reply as any).status(404).send({ error: "Task not found" })
        }

        return task
      } catch (error) {
        console.error("Error getting task:", error)
        return (reply as any).status(500).send({ error: "Failed to get task" })
      }
    }
  )

  // Update task
  app.put(
    "/:taskId",
    {
      schema: {
        description: "Update a task",
        tags: ["tasks"],
        params: {
          type: "object",
          properties: {
            taskId: { type: "string" },
          },
          required: ["taskId"],
        },
        body: {
          type: "object",
          properties: {
            assignedTo: {
              type: "array",
              items: { type: "string" },
            },
            taskOrder: { type: "number" },
            statusId: { type: "string" },
            priorityId: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            parentTaskId: { type: "string" },
            labelsTags: { type: "array", items: { type: "string" } },
            refUrls: { type: "array", items: { type: "object" } },
            attachments: { type: "array", items: { type: "object" } },
            acceptanceCriteria: { type: "array", items: { type: "object" } },
            startDate: { type: "string" },
            endDate: { type: "string" },
          },
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { taskId } = request.params as { taskId: string }
        const updateData = request.body as any

        // Check if user is authenticated
        if (!request.user?.id) {
          return (reply as any).status(401).send({ error: "Unauthorized" })
        }

        // Update the task
        const result = await updateTask(
          request as any,
          taskId,
          updateData,
          request.user.id
        )

        return { message: result.message }
      } catch (error) {
        console.error("Error updating task:", error)
        if (error instanceof Error && error.message === "Task not found") {
          return (reply as any).status(404).send({ error: "Task not found" })
        }
        return (reply as any)
          .status(500)
          .send({ error: "Failed to update task" })
      }
    }
  )

  // Delete task
  app.delete(
    "/:taskId",
    {
      schema: {
        description: "Delete a task",
        tags: ["tasks"],
        params: {
          type: "object",
          properties: {
            taskId: { type: "string" },
          },
          required: ["taskId"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { taskId } = request.params as { taskId: string }

        // Check if user is authenticated
        if (!request.user?.id) {
          return (reply as any).status(401).send({ error: "Unauthorized" })
        }

        // Delete the task
        const result = await deleteTask(request as any, taskId)

        return { message: result.message }
      } catch (error) {
        console.error("Error deleting task:", error)
        if (error instanceof Error && error.message === "Task not found") {
          return (reply as any).status(404).send({ error: "Task not found" })
        }
        return (reply as any)
          .status(500)
          .send({ error: "Failed to delete task" })
      }
    }
  )

  // Add task checklist item
  app.post(
    "/:taskId/checklist",
    {
      schema: {
        description: "Add checklist item to task",
        tags: ["tasks"],
        params: {
          type: "object",
          properties: {
            taskId: { type: "string" },
          },
          required: ["taskId"],
        },
        body: {
          type: "object",
          properties: {
            checklist: {
              type: "object",
              properties: {
                text: { type: "string" },
                checked: { type: "boolean" },
                order: { type: "number" },
              },
              required: ["text"],
            },
          },
          required: ["checklist"],
          additionalProperties: false,
        },
        response: {
          201: {
            type: "object",
            properties: {
              message: { type: "string" },
              item: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  text: { type: "string" },
                  checked: { type: "boolean" },
                  order: { type: "number" },
                  createdAt: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { taskId } = request.params as { taskId: string }
        const { checklist } = request.body as {
          checklist: { text: string; checked?: boolean; order?: number }
        }

        // Check if user is authenticated
        if (!request.user?.id) {
          return (reply as any).status(401).send({ error: "Unauthorized" })
        }

        // Add checklist item to the task
        const result = await addTaskChecklistItem(
          request as any,
          taskId,
          checklist
        )

        return reply.code(201).send({
          message: result.message,
          item: result.item,
        })
      } catch (error) {
        console.error("Error adding checklist item:", error)
        if (error instanceof Error && error.message === "Task not found") {
          return (reply as any).status(404).send({ error: "Task not found" })
        }
        return (reply as any)
          .status(500)
          .send({ error: "Failed to add checklist item" })
      }
    }
  )

  // Update task checklist item
  app.put(
    "/:taskId/checklist/:checklistId",
    {
      schema: {
        description: "Update checklist item",
        tags: ["tasks"],
        params: {
          type: "object",
          properties: {
            taskId: { type: "string" },
            checklistId: { type: "string" },
          },
          required: ["taskId", "checklistId"],
        },
        body: {
          type: "object",
          properties: {
            checklist: {
              type: "object",
              properties: {
                text: { type: "string" },
                checked: { type: "boolean" },
                order: { type: "number" },
              },
            },
          },
          required: ["checklist"],
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
              item: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  text: { type: "string" },
                  checked: { type: "boolean" },
                  order: { type: "number" },
                  createdAt: { type: "string" },
                  updatedAt: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { taskId, checklistId } = request.params as {
          taskId: string
          checklistId: string
        }
        const { checklist } = request.body as {
          checklist: { text?: string; checked?: boolean; order?: number }
        }

        // Check if user is authenticated
        if (!request.user?.id) {
          return (reply as any).status(401).send({ error: "Unauthorized" })
        }

        // Update checklist item in the task
        const result = await updateTaskChecklistItem(
          request as any,
          taskId,
          checklistId,
          checklist
        )

        return {
          message: result.message,
          item: result.item,
        }
      } catch (error) {
        console.error("Error updating checklist item:", error)
        if (error instanceof Error && error.message === "Task not found") {
          return (reply as any).status(404).send({ error: "Task not found" })
        }
        if (
          error instanceof Error &&
          error.message === "Checklist item not found"
        ) {
          return (reply as any)
            .status(404)
            .send({ error: "Checklist item not found" })
        }
        return (reply as any)
          .status(500)
          .send({ error: "Failed to update checklist item" })
      }
    }
  )

  // Remove task checklist items
  app.delete(
    "/:taskId/checklist",
    {
      schema: {
        description: "Remove checklist items from task",
        tags: ["tasks"],
        params: {
          type: "object",
          properties: {
            taskId: { type: "string" },
          },
          required: ["taskId"],
        },
        body: {
          type: "object",
          properties: {
            checklistIds: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["checklistIds"],
          additionalProperties: false,
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
              removedCount: { type: "number" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { taskId } = request.params as { taskId: string }
        const { checklistIds } = request.body as { checklistIds: string[] }

        // Check if user is authenticated
        if (!request.user?.id) {
          return (reply as any).status(401).send({ error: "Unauthorized" })
        }

        // Validate checklistIds
        if (!checklistIds || checklistIds.length === 0) {
          return (reply as any)
            .status(400)
            .send({ error: "Checklist IDs are required" })
        }

        // Remove checklist items from the task
        const result = await removeTaskChecklistItems(
          request as any,
          taskId,
          checklistIds
        )

        return {
          message: result.message,
          removedCount: result.removedCount,
        }
      } catch (error) {
        console.error("Error removing checklist items:", error)
        if (error instanceof Error && error.message === "Task not found") {
          return (reply as any).status(404).send({ error: "Task not found" })
        }
        if (
          error instanceof Error &&
          error.message.startsWith("Checklist items not found:")
        ) {
          return (reply as any).status(404).send({ error: error.message })
        }
        return (reply as any)
          .status(500)
          .send({ error: "Failed to remove checklist items" })
      }
    }
  )

  // Bulk AI generation for tasks
  app.post(
    "/bulk-ai-gen",
    {
      schema: {
        description: "Generate AI content for multiple tasks",
        tags: ["tasks"],
        body: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["user-story", "codegen"] },
            taskIds: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["type", "taskIds"],
          additionalProperties: false,
        },
        response: {
          202: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      // TODO: Implement bulk AI generation logic
      return reply.code(202).send({ message: "Tasks queued for AI generation" })
    }
  )

  // Get job status
  app.get(
    "/job-status",
    {
      schema: {
        description: "Get AI generation job status",
        tags: ["tasks"],
        response: {
          200: {
            type: "object",
            properties: {
              userStory: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    taskId: { type: "string" },
                    jobTitle: { type: "string" },
                    status: { type: "string" },
                    jobId: { type: "string" },
                  },
                },
              },
              codegen: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    taskId: { type: "string" },
                    jobTitle: { type: "string" },
                    status: { type: "string" },
                    jobId: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (_request, _reply) => {
      // TODO: Implement job status logic
      return {
        userStory: [],
        codegen: [],
      }
    }
  )
}
