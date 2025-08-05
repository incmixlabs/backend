import { MessageResponseSchema } from "@/types"
import { createRoute, z } from "@hono/zod-openapi"
import { AddNewRoleSchema, UpdateRoleSchema } from "./types"

export const addNewRole = createRoute({
  method: "post",
  path: "/{orgId}",
  summary: "Add New Role",
  tags: ["Permissions"],
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({
      orgId: z.string(),
    }),
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
  path: "/{orgId}/{id}",
  summary: "Update Role",
  tags: ["Permissions"],
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({
      orgId: z.string(),
      id: z.coerce.number(),
    }),
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
  path: "/{orgId}",
  summary: "Delete Role",
  tags: ["Permissions"],
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({
      orgId: z.string(),
      id: z.coerce.number(),
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
