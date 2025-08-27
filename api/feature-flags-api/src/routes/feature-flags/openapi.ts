import { createRoute } from "@hono/zod-openapi"
import {
  CreateFeatureFlagSchema,
  FeatureFlagIdSchema,
  FeatureFlagListSchema,
  FeatureFlagQuerySchema,
  FeatureFlagSchema,
  MessageSchema,
  UpdateFeatureFlagSchema,
} from "./types"

export const listFeatureFlags = createRoute({
  method: "get",
  path: "",
  summary: "List Feature Flags",
  tags: ["Feature Flags"],
  description: "Get all feature flags, optionally filtered by environment",
  request: {
    query: FeatureFlagQuerySchema,
  },
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: FeatureFlagListSchema,
        },
      },
      description: "Returns all feature flags for the current user",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageSchema,
        },
      },
      description: "Error response when not authenticated",
    },
    500: {
      content: {
        "application/json": {
          schema: MessageSchema,
        },
      },
      description: "Internal Server Error",
    },
  },
})

export const getFeatureFlagById = createRoute({
  method: "get",
  path: "/{featureFlagId}",
  summary: "Get Feature Flag",
  tags: ["Feature Flags"],
  description: "Get a feature flag by ID",
  request: {
    params: FeatureFlagIdSchema,
  },
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: FeatureFlagSchema,
        },
      },
      description: "Returns a feature flag for the given ID",
    },
    404: {
      content: {
        "application/json": {
          schema: MessageSchema,
        },
      },
      description: "Error response when no feature flag available for given ID",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageSchema,
        },
      },
      description: "Error response when not authenticated",
    },
    500: {
      content: {
        "application/json": {
          schema: MessageSchema,
        },
      },
      description: "Internal Server Error",
    },
  },
})

export const createFeatureFlag = createRoute({
  method: "post",
  path: "",
  summary: "Create Feature Flag",
  tags: ["Feature Flags"],
  description: "Create a new feature flag",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateFeatureFlagSchema,
        },
      },
    },
  },
  security: [{ cookieAuth: [] }],
  responses: {
    201: {
      content: {
        "application/json": {
          schema: FeatureFlagSchema,
        },
      },
      description: "Feature flag created successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: MessageSchema,
        },
      },
      description: "Bad request - validation error",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageSchema,
        },
      },
      description: "Error response when not authenticated",
    },
    409: {
      content: {
        "application/json": {
          schema: MessageSchema,
        },
      },
      description: "Conflict - feature flag with same name already exists",
    },
    500: {
      content: {
        "application/json": {
          schema: MessageSchema,
        },
      },
      description: "Internal Server Error",
    },
  },
})

export const updateFeatureFlag = createRoute({
  method: "put",
  path: "/{featureFlagId}",
  summary: "Update Feature Flag",
  tags: ["Feature Flags"],
  description: "Update an existing feature flag",
  request: {
    params: FeatureFlagIdSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateFeatureFlagSchema,
        },
      },
    },
  },
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: FeatureFlagSchema,
        },
      },
      description: "Feature flag updated successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: MessageSchema,
        },
      },
      description: "Bad request - validation error",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageSchema,
        },
      },
      description: "Error response when not authenticated",
    },
    404: {
      content: {
        "application/json": {
          schema: MessageSchema,
        },
      },
      description: "Feature flag not found",
    },
    409: {
      content: {
        "application/json": {
          schema: MessageSchema,
        },
      },
      description: "Conflict - feature flag with same name already exists",
    },
    500: {
      content: {
        "application/json": {
          schema: MessageSchema,
        },
      },
      description: "Internal Server Error",
    },
  },
})

export const deleteFeatureFlag = createRoute({
  method: "delete",
  path: "/{featureFlagId}",
  summary: "Delete Feature Flag",
  tags: ["Feature Flags"],
  description: "Delete a feature flag",
  request: {
    params: FeatureFlagIdSchema,
  },
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: MessageSchema,
        },
      },
      description: "Feature flag deleted successfully",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageSchema,
        },
      },
      description: "Error response when not authenticated",
    },
    404: {
      content: {
        "application/json": {
          schema: MessageSchema,
        },
      },
      description: "Feature flag not found",
    },
    500: {
      content: {
        "application/json": {
          schema: MessageSchema,
        },
      },
      description: "Internal Server Error",
    },
  },
})
