import { createRoute } from "@hono/zod-openapi"
import { BoardSchema, ColumnSchema, ProjectSchema } from "@incmix/shared/types"
import { ResponseSchema } from "../types"
import {
  ColumnIdSchema,
  CreateColumnSchema,
  CreateProjectSchema,
  OrgIdSchema,
  ProjectIdSchema,
} from "./types"

export const createProject = createRoute({
  path: "/",
  method: "post",
  summary: "Create Project",
  tags: ["Projects"],
  description: "Create a New Project",
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateProjectSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: ProjectSchema,
        },
      },
      description: "Creates a new Project for current User",
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
      description: "Error response when project creation fails",
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
export const createColumn = createRoute({
  path: "/columns",
  method: "post",
  summary: "Create Column",
  tags: ["Projects"],
  description: "Add new Column to board",
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateColumnSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: ColumnSchema,
        },
      },
      description: "Creates a new Column",
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
      description: "Error response when Column creation fails",
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

export const getProjects = createRoute({
  path: "/id/{orgId}",
  method: "get",
  summary: "Get Projects",
  tags: ["Projects"],
  description: "Get Projects using organization ID",
  security: [{ cookieAuth: [] }],
  request: {
    params: OrgIdSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ProjectSchema.array(),
        },
      },
      description: "Returs list of projects",
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
      description: "Error response when organization does not exist",
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

export const getColumns = createRoute({
  path: "/columns/{projectId}",
  method: "get",
  summary: "Get Columns",
  tags: ["Projects"],
  description: "Get Columns using project ID",
  security: [{ cookieAuth: [] }],
  request: {
    params: ProjectIdSchema,
    query: ColumnIdSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ColumnSchema.array(),
        },
      },
      description: "Returs list of Columns",
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

export const getBoard = createRoute({
  path: "/board/{projectId}",
  method: "get",
  summary: "Get Board",
  tags: ["Projects"],
  description: "Get Data for Creating KanBan Board",
  security: [{ cookieAuth: [] }],
  request: {
    params: ProjectIdSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: BoardSchema,
        },
      },
      description: "Data for generating KanBan Board",
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
