import { createRoute } from "@hono/zod-openapi"
import { MessageResponseSchema } from "@/types"
import {
  CreateOrgSchema,
  MemberEmailSchema,
  MemberSchema,
  MembersResponseSchema,
  OrgHandleSchema,
  OrgIdSchema,
  OrgSchema,
  PermissionsResponseSchema,
  RemoveMembersSchema,
  SuccessSchema,
  UpdateOrgSchema,
} from "./types"

export const validateHandle = createRoute({
  method: "post",
  path: "/validate-handle",
  summary: "Validate Handle",
  tags: ["Orgs"],
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: OrgHandleSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SuccessSchema,
        },
      },
      description: "Handle is valid",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Authentication Error",
    },
    500: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
    400: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Error response when Org creation fails",
    },
  },
})

export const createOrg = createRoute({
  method: "post",
  path: "",
  summary: "Create Org",
  tags: ["Orgs"],
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateOrgSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: OrgSchema,
        },
      },
      description: "Creates a new Org",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Authentication Error",
    },
    500: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
    400: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Error response when Org creation fails",
    },
  },
})

export const addMember = createRoute({
  method: "post",
  path: "/{handle}/members",
  summary: "Add Member",
  tags: ["Orgs"],
  security: [{ cookieAuth: [] }],
  request: {
    params: OrgHandleSchema,
    body: {
      content: {
        "application/json": {
          schema: MemberEmailSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: OrgSchema,
        },
      },
      description: "Add member to Org",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Authentication Error",
    },
    403: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Missing Permissions for this operation",
    },
    500: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
    400: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Error response when operation fails",
    },
    404: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Resource not found",
    },
  },
})

export const updateOrg = createRoute({
  method: "put",
  path: "/{handle}",
  summary: "Update Org",
  tags: ["Orgs"],
  security: [{ cookieAuth: [] }],
  request: {
    params: OrgHandleSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateOrgSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: OrgSchema,
        },
      },
      description: "Org Updated",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Authentication Error",
    },
    403: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Missing Permissions for this operation",
    },
    500: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
    400: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Error response when Org update fails",
    },
    404: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Resource not found",
    },
  },
})
export const deleteOrg = createRoute({
  method: "delete",
  path: "/{handle}",
  summary: "Delete Org",
  tags: ["Orgs"],
  security: [{ cookieAuth: [] }],
  request: {
    params: OrgHandleSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Org Deleted",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Authentication Error",
    },
    403: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Missing Permissions for this operation",
    },
    500: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
    404: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Resource not found",
    },
  },
})

export const removeMembers = createRoute({
  method: "delete",
  path: "/{handle}/members",
  summary: "Remove Members",
  tags: ["Orgs"],
  security: [{ cookieAuth: [] }],
  request: {
    params: OrgHandleSchema,
    body: {
      content: {
        "application/json": {
          schema: RemoveMembersSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: OrgSchema,
        },
      },
      description: "Member Removed",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Authentication Error",
    },
    403: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Missing Permissions for this operation",
    },
    500: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
    404: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Resource not found",
    },
    412: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Org must have at least one owner",
    },
  },
})

export const updateMemberRole = createRoute({
  method: "put",
  path: "/{handle}/members",
  summary: "Update Role",
  tags: ["Orgs"],
  security: [{ cookieAuth: [] }],
  request: {
    params: OrgHandleSchema,
    body: {
      content: {
        "application/json": {
          schema: MemberSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: OrgSchema,
        },
      },
      description: "Member Role Updated",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Authentication Error",
    },
    403: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Missing Permissions for this operation",
    },
    400: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Error response when Operation fails",
    },
    500: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
    404: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Resource not found",
    },
    412: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Org must have at least one owner",
    },
  },
})

export const getOrg = createRoute({
  method: "get",
  path: "/handle/{handle}",
  summary: "Get Org",
  tags: ["Orgs"],
  security: [{ cookieAuth: [] }],
  request: {
    params: OrgHandleSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: OrgSchema,
        },
      },
      description: "Org details",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Authentication Error",
    },
    403: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Missing Permissions for this operation",
    },
    404: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Resource not found",
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
export const getOrgById = createRoute({
  method: "get",
  path: "/id/{id}",
  summary: "Get Org By Id",
  tags: ["Orgs"],
  security: [{ cookieAuth: [] }],
  request: {
    params: OrgIdSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: OrgSchema,
        },
      },
      description: "Org details",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Authentication Error",
    },
    403: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Missing Permissions for this operation",
    },
    404: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Resource not found",
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

export const getUserOrgs = createRoute({
  method: "get",
  path: "/user",
  summary: "Get User's Orgs",
  tags: ["Orgs"],
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: OrgSchema.array(),
        },
      },
      description: "List user's orgs",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Authentication Error",
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

export const getorgMembers = createRoute({
  method: "get",
  path: "/{handle}/members",
  summary: "Get org Members",
  tags: ["Orgs"],
  security: [{ cookieAuth: [] }],
  request: {
    params: OrgHandleSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: MembersResponseSchema,
        },
      },
      description: "org members details",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Authentication Error",
    },
    403: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Missing Permissions for this operation",
    },
    404: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Resource not found",
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

export const getorgPermissions = createRoute({
  method: "get",
  path: "/{handle}/permissions",
  summary: "Get Member Permissions",
  tags: ["Orgs"],
  security: [{ cookieAuth: [] }],
  request: {
    params: OrgHandleSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PermissionsResponseSchema,
        },
      },
      description: "User's permissions for the org",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Authentication Error",
    },
    404: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Resource not found",
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
