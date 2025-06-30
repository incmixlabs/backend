import { createRoute } from "@hono/zod-openapi"
import { CommentSchema } from "@incmix/utils/types"
import { z } from "zod"
import { ResponseSchema } from "../types"
import {
  AddCommentSchema,
  CommentIdSchema,
  IdSchema,
  ProjectIdSchema,
  TaskIdSchema,
  UpdateCommentSchema,
} from "./types"

export const addComment = createRoute({
  path: "/{id}/comments",
  method: "post",
  summary: "Add Comment",
  tags: ["Comments"],
  description: "Add a new comment to a project or task",
  security: [{ cookieAuth: [] }],
  request: {
    params: IdSchema,
    body: {
      content: {
        "application/json": {
          schema: AddCommentSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: CommentSchema,
        },
      },
      description: "Added comment to project or task",
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
      description: "Error response when Project or Task does not exist",
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

export const updateComment = createRoute({
  path: "/{id}/{commentId}",
  method: "put",
  summary: "Update Comment",
  tags: ["Comments"],
  description: "Update an existing comment in a project or task",
  security: [{ cookieAuth: [] }],
  request: {
    params: IdSchema.merge(CommentIdSchema),
    body: {
      content: {
        "application/json": {
          schema: UpdateCommentSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: CommentSchema,
        },
      },
      description: "Updated comment in project or task",
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
      description:
        "Error response when Project, Task or Comment does not exist",
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

export const removeComment = createRoute({
  path: "/{id}/{commentId}",
  method: "delete",
  summary: "Remove Comment",
  tags: ["Comments"],
  description: "Remove comments from a project or task",
  security: [{ cookieAuth: [] }],
  request: {
    params: IdSchema.merge(CommentIdSchema),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Removed comments from project or task",
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
      description:
        "Error response when Project, Task or Comment does not exist",
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

export const getProjectComments = createRoute({
  path: "/{projectId}/project-comments",
  method: "get",
  summary: "Get Project Comments",
  tags: ["Comments"],
  description: "Get all comments for a project",
  security: [{ cookieAuth: [] }],
  request: {
    params: ProjectIdSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(CommentSchema),
        },
      },
      description: "Returns list of project comments",
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
      description: "Error response when Project does not exist",
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
export const getTaskComments = createRoute({
  path: "/{taskId}/task-comments",
  method: "get",
  summary: "Get Task Comments",
  tags: ["Comments"],
  description: "Get all comments for a task",
  security: [{ cookieAuth: [] }],
  request: {
    params: TaskIdSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(CommentSchema),
        },
      },
      description: "Returns list of task comments",
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
      description: "Error response when Task does not exist",
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
