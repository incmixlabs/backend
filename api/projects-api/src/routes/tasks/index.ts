import type { FastifyInstance } from "fastify"

export const setupTasksRoutes = async (app: FastifyInstance) => {
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
    async (_request, _reply) => {
      // TODO: Implement task listing logic
      return []
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
    async (_request, _reply) => {
      // TODO: Implement task creation logic
      return {
        id: "temp-id",
        name: "temp-name",
        message: "Task created successfully",
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
    async (_request, _reply) => {
      // TODO: Implement get task by ID logic
      return {
        id: "temp-id",
        name: "temp-name",
        description: "temp-description",
        status: "pending",
        priority: "medium",
        projectId: "temp-project-id",
        assignedTo: [],
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        completed: false,
        comments: [],
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
    async (_request, _reply) => {
      // TODO: Implement task update logic
      return { message: "Task updated successfully" }
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
    async (_request, _reply) => {
      // TODO: Implement task deletion logic
      return { message: "Task deleted successfully" }
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
            },
          },
        },
      },
    },
    async (_request, _reply) => {
      // TODO: Implement add checklist item logic
      return { message: "Checklist item added successfully" }
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
            },
          },
        },
      },
    },
    async (_request, _reply) => {
      // TODO: Implement update checklist item logic
      return { message: "Checklist item updated successfully" }
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
            },
          },
        },
      },
    },
    async (_request, _reply) => {
      // TODO: Implement remove checklist items logic
      return { message: "Checklist items removed successfully" }
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
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (_request, _reply) => {
      // TODO: Implement bulk AI generation logic
      return { message: "Tasks queued for AI generation" }
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
