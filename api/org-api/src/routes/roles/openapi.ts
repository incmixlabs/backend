import { MessageResponseSchema } from "@/types"
import { createRoute, z } from "@hono/zod-openapi"
import {
  AddNewRoleSchema,
  IdSchema,
  OrgIdSchema,
  UpdateRoleSchema,
} from "./types"

export const addNewRole = createRoute({
  method: "post",
  path: "",
  summary: "Add New Role",
  tags: ["Permissions"],
  security: [{ cookieAuth: [] }],
  request: {
    query: OrgIdSchema,
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
  path: "/{id}",
  summary: "Update Role",
  tags: ["Permissions"],
  security: [{ cookieAuth: [] }],
  request: {
    query: OrgIdSchema,
    params: IdSchema,
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
  path: "/{id}",
  summary: "Delete Role",
  tags: ["Permissions"],
  security: [{ cookieAuth: [] }],
  request: {
    query: OrgIdSchema,
    params: IdSchema,
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

export const updateMemberRole = createRoute({
  method: "put",
  path: "/member/{handle}",
  summary: "Update Member Role",
  tags: ["Permissions"],
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({
      handle: z.string().openapi({
        example: "test-org",
        description: "Org handle",
      }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            userId: z.string().openapi({
              example: "93jpbulpkkavxnz",
              description: "User ID",
            }),
            role: z.string().openapi({
              example: "Owner",
              description: "New role for the user",
            }),
          }),
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
      description: "Member role updated successfully",
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
    404: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Org or member not found",
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
