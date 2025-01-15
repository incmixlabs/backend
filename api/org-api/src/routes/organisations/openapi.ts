import { createRoute } from "@hono/zod-openapi"
import {
  MembersResponseSchema,
  PermissionsResponseSchema,
} from "@incmix/shared/types"
import {
  CreateOrgSchema,
  MemberEmailSchema,
  MemberSchema,
  MessageResponseSchema,
  OrgHandleSchema,
  OrgIdSchema,
  OrgSchema,
  RemoveMembersSchema,
  SuccessSchema,
  UpdateOrgSchema,
} from "./types"

export const validateHandle = createRoute({
  method: "post",
  path: "/validate-handle",
  summary: "Validate Handle",
  tags: ["Organisations"],
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
      description: "Error response when Organisation creation fails",
    },
  },
})

export const createOrganisation = createRoute({
  method: "post",
  path: "",
  summary: "Create Organisation",
  tags: ["Organisations"],
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
      description: "Creates a new Organisation",
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
      description: "Error response when Organisation creation fails",
    },
  },
})

export const addMember = createRoute({
  method: "post",
  path: "/{handle}/members",
  summary: "Add Member",
  tags: ["Organisations"],
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
      description: "Add member to organisation",
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

export const updateOrganisation = createRoute({
  method: "put",
  path: "/{handle}",
  summary: "Update Organisation",
  tags: ["Organisations"],
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
      description: "Organisation Updated",
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
      description: "Error response when Organisation update fails",
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
export const deleteOrganisation = createRoute({
  method: "delete",
  path: "/{handle}",
  summary: "Delete Organisation",
  tags: ["Organisations"],
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
      description: "Organisation Deleted",
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
  tags: ["Organisations"],
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
      description: "Organisation must have at least one owner",
    },
  },
})

export const updateMemberRole = createRoute({
  method: "put",
  path: "/{handle}/members",
  summary: "Update Role",
  tags: ["Organisations"],
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
      description: "Organisation must have at least one owner",
    },
  },
})

export const getOrganisation = createRoute({
  method: "get",
  path: "/handle/{handle}",
  summary: "Get Organisation",
  tags: ["Organisations"],
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
      description: "Organisation details",
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
export const getOrganisationById = createRoute({
  method: "get",
  path: "/id/{id}",
  summary: "Get Organisation By Id",
  tags: ["Organisations"],
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
      description: "Organisation details",
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

export const getUserOrganisations = createRoute({
  method: "get",
  path: "/user",
  summary: "Get User's Organisations",
  tags: ["Organisations"],
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: OrgSchema.array(),
        },
      },
      description: "List user's organisations",
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

export const getOrganizationMembers = createRoute({
  method: "get",
  path: "/{handle}/members",
  summary: "Get Organization Members",
  tags: ["Organisations"],
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
      description: "Organization members details",
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

export const getOrganizationPermissions = createRoute({
  method: "get",
  path: "/{handle}/permissions",
  summary: "Get Member Permissions",
  tags: ["Organisations"],
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
      description: "User's permissions for the organization",
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
