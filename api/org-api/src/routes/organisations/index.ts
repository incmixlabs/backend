import type { FastifyInstance } from "fastify"

export const setupOrganisationRoutes = async (app: FastifyInstance) => {
  // Get user's organizations
  app.get(
    "/",
    {
      schema: {
        description: "Get user's organizations",
        tags: ["organizations"],
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                handle: { type: "string" },
                description: { type: "string" },
                logo: { type: "string" },
                website: { type: "string" },
                role: { type: "string" },
              },
            },
          },
        },
      },
    },
    async (_request, _reply) => {
      // TODO: Implement get user organizations logic
      return []
    }
  )

  // Create organization
  app.post(
    "/",
    {
      schema: {
        description: "Create a new organization",
        tags: ["organizations"],
        body: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 1 },
            handle: { type: "string", minLength: 1 },
            description: { type: "string" },
            website: { type: "string" },
            logo: { type: "string" },
          },
          required: ["name", "handle"],
          additionalProperties: false,
        },
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              handle: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (_request, _reply) => {
      // TODO: Implement organization creation logic
      return {
        id: "temp-id",
        name: "temp-name",
        handle: "temp-handle",
        message: "Organization created successfully",
      }
    }
  )

  // Get organization by ID
  app.get(
    "/:id",
    {
      schema: {
        description: "Get organization by ID",
        tags: ["organizations"],
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
              id: { type: "string" },
              name: { type: "string" },
              handle: { type: "string" },
              description: { type: "string" },
              logo: { type: "string" },
              website: { type: "string" },
              members: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    email: { type: "string" },
                    role: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (_request, _reply) => {
      // TODO: Implement get organization by ID logic
      return {
        id: "temp-id",
        name: "temp-name",
        handle: "temp-handle",
        description: "temp-description",
        logo: "",
        website: "",
        members: [],
      }
    }
  )

  // Update organization
  app.put(
    "/:id",
    {
      schema: {
        description: "Update an organization",
        tags: ["organizations"],
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
            website: { type: "string" },
            logo: { type: "string" },
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
      // TODO: Implement organization update logic
      return { message: "Organization updated successfully" }
    }
  )

  // Delete organization
  app.delete(
    "/:id",
    {
      schema: {
        description: "Delete an organization",
        tags: ["organizations"],
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
      // TODO: Implement organization deletion logic
      return { message: "Organization deleted successfully" }
    }
  )

  // Add member to organization
  app.post(
    "/:id/members",
    {
      schema: {
        description: "Add member to organization",
        tags: ["organizations"],
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
            email: { type: "string", format: "email" },
            role: { type: "string" },
          },
          required: ["email", "role"],
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
      // TODO: Implement add member logic
      return { message: "Member added successfully" }
    }
  )

  // Remove member from organization
  app.delete(
    "/:orgId/members/:memberId",
    {
      schema: {
        description: "Remove member from organization",
        tags: ["organizations"],
        params: {
          type: "object",
          properties: {
            orgId: { type: "string" },
            memberId: { type: "string" },
          },
          required: ["orgId", "memberId"],
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
      // TODO: Implement remove member logic
      return { message: "Member removed successfully" }
    }
  )

  // Get organization members
  app.get(
    "/:id/members",
    {
      schema: {
        description: "Get organization members",
        tags: ["organizations"],
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
                joinedAt: { type: "string" },
              },
            },
          },
        },
      },
    },
    async (_request, _reply) => {
      // TODO: Implement get organization members logic
      return []
    }
  )

  // Get organization permissions
  app.get(
    "/:id/permissions",
    {
      schema: {
        description: "Get organization permissions",
        tags: ["organizations"],
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
              permissions: {
                type: "array",
                items: { type: "string" },
              },
              roles: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    permissions: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (_request, _reply) => {
      // TODO: Implement get organization permissions logic
      return {
        permissions: [],
        roles: [],
      }
    }
  )

  // Update member role
  app.put(
    "/:orgId/members/:memberId/role",
    {
      schema: {
        description: "Update member role in organization",
        tags: ["organizations"],
        params: {
          type: "object",
          properties: {
            orgId: { type: "string" },
            memberId: { type: "string" },
          },
          required: ["orgId", "memberId"],
        },
        body: {
          type: "object",
          properties: {
            role: { type: "string" },
          },
          required: ["role"],
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
      // TODO: Implement update member role logic
      return { message: "Member role updated successfully" }
    }
  )

  // Check handle availability
  app.get(
    "/check-handle/:handle",
    {
      schema: {
        description: "Check if organization handle is available",
        tags: ["organizations"],
        params: {
          type: "object",
          properties: {
            handle: { type: "string" },
          },
          required: ["handle"],
        },
        response: {
          200: {
            type: "object",
            properties: {
              available: { type: "boolean" },
            },
          },
        },
      },
    },
    async (_request, _reply) => {
      // TODO: Implement handle availability check logic
      return { available: true }
    }
  )
}
