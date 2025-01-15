import { createRoute } from "@hono/zod-openapi"
import { MessageResponseSchema } from "../types"
import {
  NewsQuerySchema,
  NewsResponseSchema,
  TopicQuerySchema,
  TopicResponseSchema,
} from "./types"

export const getNewsTopics = createRoute({
  path: "/topics",
  method: "get",
  summary: "Get News Topics",
  tags: ["News"],
  description: "Get News Topics for a specific location",
  request: {
    query: TopicQuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TopicResponseSchema,
        },
      },
      description: "Returns a list of news topics",
    },
    400: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Bad Request",
    },
  },
})
export const getNews = createRoute({
  path: "/",
  method: "get",
  summary: "Get News",
  tags: ["News"],
  description: "Get News for a specific location",
  request: {
    query: NewsQuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: NewsResponseSchema,
        },
      },
      description: "Returns weather forecast data",
    },
    400: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Bad Request",
    },
  },
})
