import {
  AuthSchema,
  EmailSchema,
  IdOrEmailSchema,
  IsEmailVerifiedSchema,
  SignupSchema,
} from "@/routes/auth/types"
import { MessageResponseSchema } from "@/routes/types"
import { createRoute } from "@hono/zod-openapi"
import {
  AuthUserSchema,
  AuthUserSessionSchema,
  UserProfileSchema,
} from "@incmix/utils/types"

export const getCurrentUser = createRoute({
  method: "get",
  path: "",
  security: [{ cookieAuth: [] }],
  summary: "Get Current User",
  tags: ["Authentication"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: AuthUserSessionSchema,
        },
      },
      description: "Returns current user data",
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
export const validateSession = createRoute({
  method: "get",
  path: "/validate-session",
  security: [{ cookieAuth: [] }],
  summary: "Validate Session",
  tags: ["Authentication"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: AuthUserSchema,
        },
      },
      description: "Returns current user data",
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

export const getUser = createRoute({
  method: "get",
  path: "/users",
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
          schema: AuthUserSchema,
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

export const logout = createRoute({
  method: "post",
  path: "/logout",
  summary: "Logout",
  tags: ["Authentication"],
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Logout current user",
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

export const signup = createRoute({
  method: "post",
  path: "/signup",
  summary: "Signup",
  tags: ["Authentication"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: SignupSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: AuthUserSchema.and(UserProfileSchema),
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

export const login = createRoute({
  method: "post",
  path: "/login",
  summary: "Login",
  tags: ["Authentication"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: AuthSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: AuthUserSessionSchema,
        },
      },
      description: "Authenticates a User with Email/Password",
    },
    403: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Error response when email is not verified",
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
      description: "Error response when Email/Password is wrong",
    },
  },
})

export const deleteUser = createRoute({
  path: "/delete",
  method: "delete",
  summary: "Delete User",
  tags: ["Authentication"],
  security: [
    {
      cookieAuth: [],
    },
  ],
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

export const checkEmailVerification = createRoute({
  method: "post",
  path: "/check-email-verification",
  summary: "Check Email Verification",
  tags: ["Authentication"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: EmailSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: IsEmailVerifiedSchema,
        },
      },
      description: "Returns whether the email is verified",
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
  },
})
