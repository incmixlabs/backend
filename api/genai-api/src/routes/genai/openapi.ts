import { createRoute, z } from "@hono/zod-openapi"
import { ResponseSchema } from "../types"
import {
  FigmaSchema,
  GenerateUserStorySchema,
  UserStoryResponseSchema,
} from "./types"

export const generateUserStory = createRoute({
  method: "post",
  path: "/generate-user-story",
  summary: "Generate User Story",
  tags: ["Tasks"],
  description:
    "Generate a user story from a prompt using AI (Claude for paid users, Gemini for free)",
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: GenerateUserStorySchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserStoryResponseSchema,
        },
      },
      description: "Returns the generated user story in markdown format",
    },
    400: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when user story generation fails",
    },
    401: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when not authenticated",
    },
    500: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
  },
})

export const generateFromFigma = createRoute({
  method: "post",
  path: "/generate/figma",
  summary: "Generate Task from Figma",
  tags: ["Tasks"],
  description:
    "Generate a task from Figma URL using AI (Claude for paid users, Gemini for free)",
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: FigmaSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserStoryResponseSchema,
        },
      },
      description: "Returns the generated Story",
    },
    400: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when task generation fails",
    },
    401: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when not authenticated",
    },
    500: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
  },
})

export const generateCodeFromFigma = createRoute({
  method: "post",
  path: "/generate/code",
  summary: "Generate React from Figma",
  tags: ["Tasks"],
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: FigmaSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "text/event-stream": {
          schema: z.object({
            reactCode: z.string(),
          }),
        },
      },
      description: "Returns the generated React code",
    },
    400: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when React generation fails",
    },
    401: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when not authenticated",
    },
    500: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
  },
})

export const getFigmaImage = createRoute({
  method: "post",
  path: "/get-figma-image",
  summary: "Get Figma Image",
  tags: ["Tasks"],
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            url: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            image: z.string(),
          }),
        },
      },
      description: "Returns the generated image",
    },
  },
  400: {
    content: {
      "application/json": {
        schema: ResponseSchema,
      },
    },
    description: "Error response when image generation fails",
  },
  401: {
    content: {
      "application/json": {
        schema: ResponseSchema,
      },
    },
    description: "Error response when not authenticated",
  },
  500: {
    content: {
      "application/json": {
        schema: ResponseSchema,
      },
    },
    description: "Internal Server Error",
  },
})
