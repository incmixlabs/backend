import { createRoute, z } from "@hono/zod-openapi"
import { createAuthMiddleware } from "@incmix-api/utils/middleware"
import { LocaleSchema } from "@/routes/locales/types"
import { MessageResponseSchema } from "@/routes/types"

export const addLocale = createRoute({
  method: "post",
  path: "",
  tags: ["Locales"],
  summary: "Add Locale",
  description: "Add new Locale",
  middleware: [createAuthMiddleware()] as const,
  request: {
    body: {
      content: {
        "application/json": { schema: LocaleSchema },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: LocaleSchema,
        },
      },
      description: "Locale added successfully",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Error response when not authenticated",
    },
    409: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Locale already exists",
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

export const updateLocale = createRoute({
  method: "put",
  path: "/{code}",
  tags: ["Locales"],
  summary: "Update Locale",
  description: "Update existing locale",
  middleware: [createAuthMiddleware()] as const,
  request: {
    params: z.object({
      code: z.string({ message: "Code is required" }),
    }),
    body: {
      content: {
        "application/json": { schema: LocaleSchema },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: LocaleSchema,
        },
      },
      description: "Locale updated successfully",
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
      description: "Locale doesn't exist",
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

export const getDefaultLocale = createRoute({
  method: "get",
  path: "/default",
  tags: ["Locales"],
  summary: "Get Default Locale",
  description: "Get default locale",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: LocaleSchema,
        },
      },
      description: "Locale found",
    },
    404: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Locale doesn't exist",
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

export const getLocale = createRoute({
  method: "get",
  path: "/{code}",
  tags: ["Locales"],
  summary: "Get Locale",
  description: "Get existing locale",
  request: {
    params: z.object({
      code: z.string({ message: "Code is required" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: LocaleSchema,
        },
      },
      description: "Locale found",
    },
    404: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Locale doesn't exist",
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

export const getAllLocales = createRoute({
  method: "get",
  path: "",
  tags: ["Locales"],
  summary: "Get All Locales",
  description: "Get all locales",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(LocaleSchema),
        },
      },
      description: "Locale found",
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

export const deleteLocale = createRoute({
  method: "delete",
  path: "/{code}",
  tags: ["Locales"],
  summary: "Delete Locale",
  description: "Delete existing locale",
  request: {
    params: z.object({
      code: z.string({ message: "Code is required" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: LocaleSchema,
        },
      },
      description: "Locale Deleted",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Error response when not authenticated",
    },
    409: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Invalid Request",
    },
    404: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Locale doesn't exist",
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
