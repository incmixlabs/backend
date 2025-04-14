import { createRoute, z } from "@hono/zod-openapi"
import { newStoryTemplateSchema, storyTemplateSchema } from "./types"
import { ResponseSchema } from "../types"

export const getStoryTemplates = createRoute({
  method: "get",
  path: "",
  tags: ["Templates"],
  summary: "Get story templates",
  description: "Get all story templates",
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": { schema: storyTemplateSchema.array() },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": { schema: ResponseSchema },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": { schema: ResponseSchema },
      },
    },
    500: {
      description: "Internal Server Error",
      content: {
        "application/json": { schema: ResponseSchema },
      },
    },
  },
})

export const generateStoryTemplate = createRoute({
  method: "post",
  path: "/generate",
  tags: ["Templates"],
  summary: "Generate story template",
  description: "Generate a story template",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            prompt: z.string(),
            userTier: z.enum(["free", "paid"]),
            format: z.enum(["markdown", "html", "plainText"]),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": { schema: z.object({ template: z.string() }) },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": { schema: ResponseSchema },
      },
    },
    500: {
      description: "Internal Server Error",
      content: {
        "application/json": { schema: ResponseSchema },
      },
    },
  },
})

export const insertStoryTemplate = createRoute({
  method: "post",
  path: "/insert",
  tags: ["Templates"],
  summary: "Insert story template",
  description: "Insert a story template",
  request: {
    body: {
      content: {
        "application/json": {
          schema: newStoryTemplateSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Success",
      content: {
        "application/json": { schema: storyTemplateSchema },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": { schema: ResponseSchema },
      },
    },
    409: {
      description: "Conflict",
      content: {
        "application/json": { schema: ResponseSchema },
      },
    },
    500: {
      description: "Internal Server Error",
      content: {
        "application/json": { schema: ResponseSchema },
      },
    },
  },
})
