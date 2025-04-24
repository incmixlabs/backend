import {
  CreateTaskSchema,
  FigmaSchema,
  GenerateUserStorySchema,
  ParamSchema,
  TaskListSchema,
  UpdateTaskSchema,
  UserStoryResponseSchema,
} from "@/routes/tasks/types"
import { createRoute, z } from "@hono/zod-openapi"
import { TaskSchema } from "@incmix/utils/types"
import { ResponseSchema } from "../types"

export const listTasks = createRoute({
  method: "get",
  path: "",
  summary: "List Tasks",
  tags: ["Tasks"],
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TaskListSchema,
        },
      },
      description: "Returns All task for current User",
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

export const taskById = createRoute({
  method: "get",
  path: "/id/{id}",
  summary: "Get Task",
  tags: ["Tasks"],
  description: "Get Task by Id",
  request: {
    params: ParamSchema,
  },
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TaskSchema,
        },
      },
      description: "Returns a Task for given ID",
    },
    404: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when No task available for given ID",
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

export const createTask = createRoute({
  method: "post",
  path: "",
  summary: "Create Task",
  tags: ["Tasks"],
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateTaskSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: TaskSchema,
        },
      },
      description: "Creates a new Task for current User",
    },
    401: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when not authenticated",
    },
    400: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when task creation fails",
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

export const updateTask = createRoute({
  method: "put",
  path: "/{id}",
  summary: "Update Task",
  tags: ["Tasks"],
  security: [{ cookieAuth: [] }],
  request: {
    params: ParamSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateTaskSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TaskSchema,
        },
      },
      description: "Updates existing Task for current User",
    },
    401: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when not authenticated",
    },
    404: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when No task available for given ID",
    },
    400: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when task update fails",
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

export const deleteTask = createRoute({
  method: "delete",
  path: "/{id}",
  summary: "Delete Task",
  tags: ["Tasks"],
  security: [{ cookieAuth: [] }],
  request: {
    params: ParamSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TaskSchema,
        },
      },
      description: "Deletes a Task for given ID",
    },
    400: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when Task deletion fails",
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
          schema: z.object({
            url: z.string().url(),
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
