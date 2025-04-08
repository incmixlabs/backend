import { createRoute, z } from "@hono/zod-openapi"
import { MessageResponseSchema } from "../organisations/types"
import {
  AddNewRoleSchema,
  PermissionRolesResponseSchema,
  UpdatePermissionSchema,
  UpdateRoleSchema,
} from "./types"

/**
 * Route for retrieving all roles and permissions.
 * Requires authentication and appropriate permissions to access data.
 */
export const getRolesPermissions = createRoute({
  method: "get",
  path: "",
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
  path: "",
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

export const addNewRole = createRoute({
  method: "post",
  path: "/roles",
  summary: "Add New Role",
  tags: ["Permissions"],
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: AddNewRoleSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Role added successfully",
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

export const updateRole = createRoute({
  method: "put",
  path: "/roles",
  summary: "Update Role",
  tags: ["Permissions"],
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: UpdateRoleSchema,
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
      description: "Role updated successfully",
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
export const deleteRole = createRoute({
  method: "delete",
  path: "/roles/{id}",
  summary: "Delete Role",
  tags: ["Permissions"],
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({
      id: z.number(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Role deleted successfully",
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
