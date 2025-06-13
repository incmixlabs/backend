import { createRoute } from "@hono/zod-openapi"
import { BoardSchema, ColumnSchema, ProjectSchema } from "@incmix/utils/types"
import { ResponseSchema } from "../types"
import {
  AddProjectChecklistSchema,
  AddProjectMemberSchema,
  CreateColumnSchema,
  CreateProjectSchema,
  IdSchema,
  ParentColumnIdSchema,
  RemoveProjectChecklistSchema,
  RemoveProjectMemberSchema,
  UpdateColumnSchema,
  UpdateProjectChecklistSchema,
  UpdateProjectSchema,
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
        "multipart/form-data": {
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

export const listProjects = createRoute({
  path: "/",
  method: "get",
  summary: "List Projects",
  tags: ["Projects"],
  description: "List Projects for current user",
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ProjectSchema.omit({
            members: true,
            checklists: true,
            comments: true,
          }).array(),
        },
      },
      description: "Returns list of projects",
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

export const addProjectMembers = createRoute({
  path: "/{id}/members",
  method: "post",
  summary: "Add Project Member",
  tags: ["Projects"],
  description: "Add Project Member to project",
  security: [{ cookieAuth: [] }],
  request: {
    params: IdSchema,
    body: {
      content: {
        "application/json": {
          schema: AddProjectMemberSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ProjectSchema,
        },
      },
      description: "Added Project Member",
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
    409: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Error response when Project Member already exists",
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

export const removeProjectMembers = createRoute({
  path: "/{id}/members",
  method: "delete",
  summary: "Remove Project Member",
  tags: ["Projects"],
  description: "Remove Project Member from project",
  security: [{ cookieAuth: [] }],
  request: {
    params: IdSchema,
    body: {
      content: {
        "application/json": {
          schema: RemoveProjectMemberSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ProjectSchema,
        },
      },
      description: "Removed Project Members",
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

export const updateProject = createRoute({
  path: "/{id}",
  method: "put",
  summary: "Update Project",
  tags: ["Projects"],
  description: "Update Project using ID",
  security: [{ cookieAuth: [] }],
  request: {
    params: IdSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateProjectSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ProjectSchema,
        },
      },
      description: "Updated Project",
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

export const deleteProject = createRoute({
  path: "/{id}",
  method: "delete",
  summary: "Delete Project",
  tags: ["Projects"],
  description: "Delete Project",
  security: [{ cookieAuth: [] }],
  request: {
    params: IdSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Deleted Project",
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

export const listColumns = createRoute({
  path: "/columns/{id}",
  method: "get",
  summary: "List Columns",
  tags: ["Projects"],
  description: "List Columns for project",
  security: [{ cookieAuth: [] }],
  request: {
    params: IdSchema,
    query: ParentColumnIdSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ColumnSchema.array(),
        },
      },
      description: "Returns list of Columns",
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

export const updateColumn = createRoute({
  path: "/columns/{id}",
  method: "put",
  summary: "Update Column",
  tags: ["Projects"],
  description: "Update Column",
  security: [{ cookieAuth: [] }],
  request: {
    params: IdSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateColumnSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ColumnSchema,
        },
      },
      description: "Updated Column",
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
      description: "Error response when Column does not exist",
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

export const deleteColumn = createRoute({
  path: "/columns/{id}",
  method: "delete",
  summary: "Delete Column",
  tags: ["Projects"],
  description: "Delete Column",
  security: [{ cookieAuth: [] }],
  request: {
    params: IdSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Deleted Column",
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
      description: "Error response when Column does not exist",
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

export const getBoardData = createRoute({
  path: "/board/{id}",
  method: "get",
  summary: "Get Board Data",
  tags: ["Projects"],
  description: "Get Data for Creating KanBan Board for project",
  security: [{ cookieAuth: [] }],
  request: {
    params: IdSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: BoardSchema,
        },
      },
      description: "Data for generating KanBan Board for project",
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

export const addProjectChecklist = createRoute({
  path: "/{id}/checklists",
  method: "post",
  summary: "Add Project Checklist",
  tags: ["Projects"],
  description: "Add a new checklist item to a project",
  security: [{ cookieAuth: [] }],
  request: {
    params: IdSchema,
    body: {
      content: {
        "application/json": {
          schema: AddProjectChecklistSchema,
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
      description: "Added checklist item to project",
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

export const updateProjectChecklist = createRoute({
  path: "/{id}/checklists",
  method: "put",
  summary: "Update Project Checklist",
  tags: ["Projects"],
  description: "Update an existing checklist item in a project",
  security: [{ cookieAuth: [] }],
  request: {
    params: IdSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateProjectChecklistSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ProjectSchema,
        },
      },
      description: "Updated checklist item in project",
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
      description: "Error response when Project or Checklist does not exist",
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

export const removeProjectChecklist = createRoute({
  path: "/{id}/checklists",
  method: "delete",
  summary: "Remove Project Checklist",
  tags: ["Projects"],
  description: "Remove checklist items from a project",
  security: [{ cookieAuth: [] }],
  request: {
    params: IdSchema,
    body: {
      content: {
        "application/json": {
          schema: RemoveProjectChecklistSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ProjectSchema,
        },
      },
      description: "Removed checklist items from project",
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
