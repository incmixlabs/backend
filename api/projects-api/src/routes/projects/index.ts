import type { FastifyInstance } from "fastify"

export const setupProjectRoutes = async (app: FastifyInstance) => {
  // Get projects reference data
  app.get(
    "/reference",
    {
      schema: {
        description: "Get projects reference data",
        tags: ["projects"],
        response: {
          200: {
            type: "object",
            properties: {
              statuses: {
                type: "array",
                items: { type: "string" },
              },
              roles: {
                type: "array",
                items: { type: "string" },
              },
              priorities: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
        },
      },
    },
    async (_request, _reply) => {
      const referenceData = {
        statuses: [
          "planning",
          "in_progress",
          "completed",
          "on-hold",
          "cancelled",
        ],
        roles: ["project_manager", "developer", "designer", "tester", "viewer"],
        priorities: ["low", "medium", "high", "critical"],
      }

      return referenceData
    }
  )

  // List projects
  app.get(
    "/orgs/:orgId",
    {
      schema: {
        description: "List projects for an org",
        tags: ["projects"],
        params: {
          type: "object",
          properties: {
            orgId: { type: "string" },
          },
          required: ["orgId"],
        },
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
                orgId: { type: "string" },
                logo: { type: "string" },
                budget: { type: "number" },
                company: { type: "string" },
              },
            },
          },
        },
      },
    },
    async (_request, _reply) => {
      // TODO: Implement project listing logic
      return []
    }
  )

  // Create project
  app.post(
    "/",
    {
      schema: {
        description: "Create a new project",
        tags: ["projects"],
        body: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string", minLength: 1 },
            orgId: { type: "string", minLength: 1 },
            description: { type: "string" },
            status: { type: "string" },
            startDate: { type: "string" },
            endDate: { type: "string" },
            company: { type: "string" },
            budget: { type: "number" },
            acceptanceCriteria: { type: "string" },
            checklist: { type: "string" },
            members: { type: "string" },
          },
          required: ["name", "orgId"],
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
    async (_request, reply) => {
      // TODO: Implement project creation logic
      const payload = {
        id: "temp-id",
        name: "temp-name",
        message: "Project created successfully",
      }
      return reply.code(201).send(payload)
    }
  )

  // Update project
  app.put(
    "/:id",
    {
      schema: {
        description: "Update a project",
        tags: ["projects"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            status: { type: "string" },
            startDate: { type: "string" },
            endDate: { type: "string" },
            budget: { type: "number" },
            company: { type: "string" },
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
      // TODO: Implement project update logic
      return { message: "Project updated successfully" }
    }
  )

  // Delete project
  app.delete(
    "/:id",
    {
      schema: {
        description: "Delete a project",
        tags: ["projects"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
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
      // TODO: Implement project deletion logic
      return { message: "Project deleted successfully" }
    }
  )

  // Add project members
  app.post(
    "/:id/members",
    {
      schema: {
        description: "Add members to a project",
        tags: ["projects"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            members: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  role: { type: "string" },
                },
                required: ["id"],
              },
            },
          },
          required: ["members"],
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
      // TODO: Implement add project members logic
      return { message: "Members added successfully" }
    }
  )

  // Remove project members
  app.delete(
    "/:id/members",
    {
      schema: {
        description: "Remove members from a project",
        tags: ["projects"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            memberIds: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["memberIds"],
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
      // TODO: Implement remove project members logic
      return { message: "Members removed successfully" }
    }
  )

  // Get project members
  app.get(
    "/:id/members",
    {
      schema: {
        description: "Get project members",
        tags: ["projects"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                email: { type: "string" },
                role: { type: "string" },
                isOwner: { type: "boolean" },
              },
            },
          },
        },
      },
    },
    async (_request, _reply) => {
      // TODO: Implement get project members logic
      return []
    }
  )

  // Add project checklist item
  app.post(
    "/:id/checklist",
    {
      schema: {
        description: "Add checklist item to project",
        tags: ["projects"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
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
    async (_request, reply) => {
      // TODO: Implement add checklist item logic
      return reply
        .code(201)
        .send({ message: "Checklist item added successfully" })
    }
  )

  // Update project checklist item
  app.put(
    "/:projectId/checklist/:checklistId",
    {
      schema: {
        description: "Update checklist item",
        tags: ["projects"],
        params: {
          type: "object",
          properties: {
            projectId: { type: "string" },
            checklistId: { type: "string" },
          },
          required: ["projectId", "checklistId"],
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

  // Remove project checklist items
  app.delete(
    "/:id/checklist",
    {
      schema: {
        description: "Remove checklist items from project",
        tags: ["projects"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
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
}
