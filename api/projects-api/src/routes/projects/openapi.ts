import { createRoute, z } from "@hono/zod-openapi"
import { ProjectSchema } from "@incmix-api/utils/zod-schema"
import { ResponseSchema } from "../types"
import {
  AddProjectChecklistSchema,
  AddProjectMemberSchema,
  ChecklistIdSchema,
  CreateProjectSchema,
  IdSchema,
  OrgIdSchema,
  ProjectListSchema,
  RemoveProjectChecklistSchema,
  RemoveProjectMemberSchema,
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

export const listProjects = createRoute({
  path: "/{orgId}",
  method: "get",
  summary: "List Projects",
  tags: ["Projects"],
  description: "List Projects for current user",
  security: [{ cookieAuth: [] }],
  request: {
    params: OrgIdSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ProjectListSchema,
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
  path: "/{projectId}/checklists/{checklistId}",
  method: "put",
  summary: "Update Project Checklist",
  tags: ["Projects"],
  description: "Update an existing checklist item in a project",
  security: [{ cookieAuth: [] }],
  request: {
    params: ChecklistIdSchema,
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

export const getProjectMembers = createRoute({
  path: "/{id}/members",
  method: "get",
  summary: "Get Project Members",
  tags: ["Projects"],
  description: "Get all members of a project",
  security: [{ cookieAuth: [] }],
  request: {
    params: IdSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(
            z.object({
              id: z.string(),
              role: z.string(),
              isOwner: z.boolean(),
              name: z.string(),
              email: z.string(),
              avatar: z.string().nullable(),
            })
          ),
        },
      },
      description: "Returns list of project members",
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
