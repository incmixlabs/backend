import { createRoute } from "@hono/zod-openapi"
import { MessageResponseSchema } from "../organisations/types"
import { PermissionRolesResponseSchema, UpdatePermissionSchema } from "./types"

/**
 * Route for retrieving all roles and permissions.
 * Requires authentication and appropriate permissions to access data.
 */
export const getRolesPermissions = createRoute({
  method: "get",
  path: "/roles-permissions",
  summary: "Get All Roles and Permissions",
  tags: ["Permissions"],
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PermissionRolesResponseSchema,
        },
      },
      description: "Roles and permissions for the organization",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Authentication Error",
    },
    403: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Forbidden - Insufficient permissions",
    },
    500: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
  },
})

/**
 * Route for updating permissions for specific roles.
 * Requires authentication and administrative permissions to modify role permissions.
 */
export const updatePermissions = createRoute({
  method: "put",
  path: "/roles-permissions",
  summary: "Update Permissions",
  tags: ["Permissions"],
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: UpdatePermissionSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Permission updated",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Authentication Error",
    },
    403: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Forbidden - Insufficient permissions",
    },
    500: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
  },
})
