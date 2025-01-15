import { createRoute } from "@hono/zod-openapi"

import { UserProfilePaginatedSchema } from "@incmix/shared/types"
import {
  UserProfileSchema,
  optionalPresignedUrlSchema,
} from "@incmix/shared/types"
import { PermissionSchema } from "@incmix/shared/types"
import {
  FullNameSchema,
  IdOrEmailSchema,
  IdSchema,
  MessageResponseSchema,
  OrgIdSchema,
  UploadFileSchema,
} from "./types"

export const getUserpermissions = createRoute({
  method: "get",
  path: "/permissions",
  summary: "Get User Permissions",
  tags: ["Users"],
  request: {
    query: OrgIdSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PermissionSchema.array(),
        },
      },
      description: "Returns user permissions",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "User not logged in",
    },
  },
})

export const createUserProfile = createRoute({
  method: "post",
  path: "",
  summary: "Create User",
  tags: ["Users"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: UserProfileSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: UserProfileSchema,
        },
      },
      description: "Creates a new User account",
    },
    500: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
    409: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Error response when signup fails",
    },
  },
})

export const getUser = createRoute({
  method: "get",
  path: "/",
  security: [{ cookieAuth: [] }],
  summary: "Get User",
  tags: ["Users"],
  request: {
    query: IdOrEmailSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserProfileSchema,
        },
      },
      description: "Returns user data",
    },
    404: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "User not found",
    },
    500: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Error response when not authenticated",
    },
  },
})

export const getAllUsers = createRoute({
  method: "get",
  path: "/list",
  summary: "Get All Users",
  tags: ["Users"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserProfilePaginatedSchema,
        },
      },
      description: "Returns list of users",
    },
    500: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Error response when not authenticated",
    },
  },
})

export const getCurrentUser = createRoute({
  method: "get",
  path: "/me",
  security: [{ cookieAuth: [] }],
  summary: "Get Current User",
  tags: ["Users"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserProfileSchema,
        },
      },
      description: "Returns user data",
    },
    404: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "User not found",
    },
    500: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Error response when not authenticated",
    },
  },
})

export const deleteUser = createRoute({
  path: "/{id}",
  method: "delete",
  summary: "Delete User",
  tags: ["Users"],
  security: [
    {
      cookieAuth: [],
    },
  ],
  request: {
    params: IdSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "User deleted successfully",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Unauthorized",
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

export const updateUser = createRoute({
  path: "/{id}",
  method: "put",
  summary: "Update User",
  tags: ["Users"],
  security: [
    {
      cookieAuth: [],
    },
  ],
  request: {
    params: IdSchema,
    body: {
      content: {
        "application/json": {
          schema: FullNameSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserProfileSchema,
        },
      },
      description: "User information updated successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "User not found",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Authentication Required",
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

export const addProfilePicture = createRoute({
  method: "put",
  path: "/{id}/profile-picture",
  summary: "Add Profile Picture",
  tags: ["Users"],
  security: [{ cookieAuth: [] }],
  request: {
    params: IdSchema,
    body: {
      content: {
        "multipart/form-data": {
          schema: UploadFileSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserProfileSchema,
        },
      },
      description: "Profile picture added successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Invalid file or request",
    },
    404: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "User not found",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Authentication Required",
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

export const deleteProfilePicture = createRoute({
  method: "delete",
  path: "/{id}/profile-picture",
  summary: "Delete Profile Picture",
  tags: ["Users"],
  security: [{ cookieAuth: [] }],
  request: {
    params: IdSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserProfileSchema,
        },
      },
      description: "Profile picture deleted successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "No profile picture to delete",
    },
    404: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "User not found",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Authentication Required",
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

export const getProfilePicture = createRoute({
  method: "get",
  path: "/{id}/profile-picture",
  summary: "Get Profile Picture",
  tags: ["Users"],
  security: [{ cookieAuth: [] }],
  request: {
    params: IdSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: optionalPresignedUrlSchema,
        },
      },
      description: "Returns the profile picture",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Authentication Required",
    },
    404: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "No profile picture found",
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
