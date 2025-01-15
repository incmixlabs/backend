import { createRoute } from "@hono/zod-openapi"
import { ResponseSchema } from "../types"
import {
  PullChangesSchema,
  PushChangesSchema,
  SyncQuerySchema,
  VersionSchema,
} from "./types"

export const getSchema = createRoute({
  path: "/schema",
  method: "get",
  summary: "Get Schema",
  description: "Get SQL Schema Definition",
  tags: ["Sync"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: VersionSchema,
        },
      },
      description: "Return Database Schema Definition",
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
export const pushChanges = createRoute({
  path: "",
  method: "post",
  summary: "Push Changes",
  description: "Push Changes to Database",
  tags: ["Sync"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: PushChangesSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Changes pushed successfully",
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
export const pullChanges = createRoute({
  path: "",
  method: "get",
  summary: "Pull Changes",
  description: "Pull Changes to Database",
  tags: ["Sync"],
  request: {
    query: SyncQuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PullChangesSchema,
        },
      },
      description: "Return Updated tasks and columns",
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
