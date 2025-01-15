import { createRoute } from "@hono/zod-openapi"
import { PaginatedUserSchema } from "@incmix/shared/types"
import { MessageResponseSchema } from "../types"
import { PasswordValueSchema, ValueSchema } from "./types"

export const getAllUsers = createRoute({
  path: "/getAll",
  method: "get",
  summary: "Get All Users",
  tags: ["Users"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PaginatedUserSchema,
        },
      },
      description: "List of Users",
    },
    500: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Error response when not authenticated",
    },
  },
})

export const setVerified = createRoute({
  path: "/setVerified",
  method: "put",
  security: [{ cookieAuth: [] }],
  summary: "Set User Verified",
  tags: ["Users"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: ValueSchema,
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
      description: "Set User Verified Successfully",
    },
    500: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Error response when not authenticated",
    },
    403: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Error response when not authorized",
    },
  },
})

export const setEnabled = createRoute({
  path: "/setEnabled",
  method: "put",
  security: [{ cookieAuth: [] }],
  summary: "Set User Enabled",
  tags: ["Users"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: ValueSchema,
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
      description: "Set User Enabled Successfully",
    },
    500: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Error response when not authenticated",
    },
    403: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Error response when not authorized",
    },
  },
})
export const setPassword = createRoute({
  path: "/setPassword",
  method: "put",
  security: [{ cookieAuth: [] }],
  summary: "Set User password",
  tags: ["Users"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: PasswordValueSchema,
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
      description: "Set User Password Successfully",
    },
    500: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Error response when not authenticated",
    },
    403: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Error response when not authorized",
    },
  },
})
