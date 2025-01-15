import { MessageSchema, NamespaceSchema } from "@/routes/messages/types"
import { MessageResponseSchema } from "@/routes/types"
import { createRoute, z } from "@hono/zod-openapi"

export const getDefaultMessages = createRoute({
  method: "get",
  path: "/default",
  description: "Get All Messages for default locale",
  summary: "Get Default Messages",
  tags: ["Messages"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(MessageSchema),
        },
      },
      description: "Returns messages",
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

export const getAllMessages = createRoute({
  method: "get",
  path: "/{locale}",
  description: "Get All Messages for locale",
  summary: "Get All Messages",
  tags: ["Messages"],
  request: {
    params: z.object({
      locale: z
        .string({ required_error: "Locale is required" })
        .min(1)
        .openapi({ example: "en" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(MessageSchema),
        },
      },
      description: "Returns messages",
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
export const getMessagesByNamespace = createRoute({
  method: "get",
  path: "/namespaces/{locale}/{namespace}",
  description: "Get All Messages for locale",
  summary: "Get Messages By Namespace",
  tags: ["Messages"],
  request: {
    params: z.object({
      locale: z
        .string({ required_error: "Locale is required" })
        .min(1)
        .openapi({ example: "en" }),
      namespace: z
        .string({ required_error: "Namespace is required" })
        .min(1)
        .openapi({ example: "auth" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: NamespaceSchema,
        },
      },
      description: "Returns messages",
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

export const getMessage = createRoute({
  method: "get",
  path: "/{locale}/{key}",
  description: "Get a Message by key",
  summary: "Get Message",
  tags: ["Messages"],
  request: {
    params: z.object({
      locale: z
        .string({ required_error: "Locale is required" })
        .openapi({ example: "en" }),
      key: z
        .string({ required_error: "Key is required" })
        .openapi({ example: "button_login" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: MessageSchema,
        },
      },
      description: "Returns message by Key",
    },
    404: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "No Message found for given Key",
    },
    422: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Invalid Key or Key not provided",
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

export const addMessage = createRoute({
  method: "post",
  path: "",
  description: "Add a new Message for locale and key",
  summary: "Add Message",
  tags: ["Messages"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: MessageSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: MessageSchema,
        },
      },
      description: "Message added successfully",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Error response when not authenticated",
    },
    404: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Locale not found",
    },
    409: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Key Already exists for given locale",
    },
    422: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Invalid request body",
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

export const updateMessage = createRoute({
  method: "put",
  path: "",
  description: "Update Message for locale and key",
  summary: "Update Message",
  tags: ["Messages"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: MessageSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: MessageSchema,
        },
      },
      description: "Message updated successfully",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Error response when not authenticated",
    },
    404: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Locale or key not found",
    },
    422: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Invalid request body",
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
