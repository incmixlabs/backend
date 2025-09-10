import type { FastifyInstance } from "fastify"

export const setupPermissionRoutes = async (app: FastifyInstance) => {
  // Get all available permissions reference data
  app.get(
    "/reference",
    {
      schema: {
        description: "Get permissions reference data",
        tags: ["permissions"],
        response: {
          200: {
            type: "object",
            properties: {
              actions: {
                type: "array",
                items: { type: "string" },
              },
              subjects: {
                type: "array",
                items: { type: "string" },
              },
              roles: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
        },
      },
    },
    async (_request, _reply) => {
      // TODO: Implement permissions reference logic
      const referenceData = {
        actions: ["create", "read", "update", "delete", "manage"],
        subjects: ["User", "Project", "Task", "Organization"],
        roles: ["owner", "admin", "member", "viewer"],
      }

      return referenceData
    }
  )

  // Get roles for an organization
  app.get(
    "/organizations/:orgId/roles",
    {
      schema: {
        description: "Get roles for an organization",
        tags: ["permissions"],
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
                permissions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      action: { type: "string" },
                      subject: { type: "string" },
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
      // TODO: Implement get organization roles logic
      return []
    }
  )

  // Create new role
  app.post(
    "/organizations/:orgId/roles",
    {
      schema: {
        description: "Create a new role",
        tags: ["permissions"],
        params: {
          type: "object",
          properties: {
            orgId: { type: "string" },
          },
          required: ["orgId"],
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 1 },
            permissions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  subject: { type: "string" },
                },
                required: ["action", "subject"],
              },
            },
          },
          required: ["name", "permissions"],
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
      // TODO: Implement create role logic
      return {
        id: "temp-id",
        name: "temp-name",
        message: "Role created successfully",
      }
    }
  )

  // Update role
  app.put(
    "/organizations/:orgId/roles/:roleId",
    {
      schema: {
        description: "Update a role",
        tags: ["permissions"],
        params: {
          type: "object",
          properties: {
            orgId: { type: "string" },
            roleId: { type: "string" },
          },
          required: ["orgId", "roleId"],
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            permissions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  subject: { type: "string" },
                },
                required: ["action", "subject"],
              },
            },
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
      // TODO: Implement update role logic
      return { message: "Role updated successfully" }
    }
  )

  // Delete role
  app.delete(
    "/organizations/:orgId/roles/:roleId",
    {
      schema: {
        description: "Delete a role",
        tags: ["permissions"],
        params: {
          type: "object",
          properties: {
            orgId: { type: "string" },
            roleId: { type: "string" },
          },
          required: ["orgId", "roleId"],
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
      // TODO: Implement delete role logic
      return { message: "Role deleted successfully" }
    }
  )

  // Add permission to role
  app.post(
    "/organizations/:orgId/roles/:roleId/permissions",
    {
      schema: {
        description: "Add permission to role",
        tags: ["permissions"],
        params: {
          type: "object",
          properties: {
            orgId: { type: "string" },
            roleId: { type: "string" },
          },
          required: ["orgId", "roleId"],
        },
        body: {
          type: "object",
          properties: {
            action: { type: "string" },
            subject: { type: "string" },
          },
          required: ["action", "subject"],
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
      // TODO: Implement add permission to role logic
      return { message: "Permission added to role successfully" }
    }
  )

  // Remove permission from role
  app.delete(
    "/organizations/:orgId/roles/:roleId/permissions",
    {
      schema: {
        description: "Remove permission from role",
        tags: ["permissions"],
        params: {
          type: "object",
          properties: {
            orgId: { type: "string" },
            roleId: { type: "string" },
          },
          required: ["orgId", "roleId"],
        },
        body: {
          type: "object",
          properties: {
            action: { type: "string" },
            subject: { type: "string" },
          },
          required: ["action", "subject"],
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
      // TODO: Implement remove permission from role logic
      return { message: "Permission removed from role successfully" }
    }
  )
}
