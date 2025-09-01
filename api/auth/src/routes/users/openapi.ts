import { createRoute } from "@hono/zod-openapi"

import {
  FullNameSchema,
  IdSchema,
  MessageResponseSchema,
  OnboardingResponseSchema,
  OnboardingSchema,
  OptionalPresignedUrlSchema,
  PasswordValueSchema,
  UploadFileSchema,
  UserProfilePaginatedSchema,
  UserProfileSchema,
  ValueSchema,
} from "./types"

export const userOnboarding = createRoute({
  method: "post",
  path: "/onboarding",
  summary: "User Onboarding",
  description: "User Onboarding",
  tags: ["Users"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: OnboardingSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: OnboardingResponseSchema,
        },
      },
      description: "User Onboarding success",
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

export const updateUser = createRoute({
  path: "/update",
  method: "put",
  summary: "Update User",
  tags: ["Profile"],
  security: [
    {
      cookieAuth: [],
    },
  ],
  request: {
    query: IdSchema.partial(),
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
  path: "/profile-picture",
  summary: "Add Profile Picture",
  tags: ["Profile"],
  security: [{ cookieAuth: [] }],
  request: {
    query: IdSchema.partial(),
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
  path: "/profile-picture",
  summary: "Delete Profile Picture",
  tags: ["Profile"],
  security: [{ cookieAuth: [] }],
  request: {
    query: IdSchema.partial(),
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
  path: "/profile-picture",
  summary: "Get Profile Picture",
  tags: ["Profile"],
  security: [{ cookieAuth: [] }],
  request: {
    query: IdSchema.partial(),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: OptionalPresignedUrlSchema,
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

export const setVerified = createRoute({
  path: "/setVerified",
  method: "put",
  security: [{ cookieAuth: [] }],
  summary: "Set User Verified",
  tags: ["Users"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: ValueSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Set User Verified Successfully",
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
    403: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Error response when not authorized",
    },
  },
})

export const setEnabled = createRoute({
  path: "/setEnabled",
  method: "put",
  security: [{ cookieAuth: [] }],
  summary: "Set User Enabled",
  tags: ["Users"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: ValueSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Set User Enabled Successfully",
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
    403: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Error response when not authorized",
    },
  },
})
export const setPassword = createRoute({
  path: "/setPassword",
  method: "put",
  security: [{ cookieAuth: [] }],
  summary: "Set User password",
  tags: ["Users"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: PasswordValueSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Set User Password Successfully",
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
    403: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Error response when not authorized",
    },
  },
})
