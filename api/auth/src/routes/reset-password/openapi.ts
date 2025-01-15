import {
  ForgetPassowrdSchema,
  ResetPasswordSchema,
} from "@/routes/reset-password/types"
import { EmailSchema, MessageResponseSchema } from "@/routes/types"
import { createRoute } from "@hono/zod-openapi"

export const resetPassword = createRoute({
  method: "post",
  path: "/",
  summary: "Reset Password",
  tags: ["Password Reset"],
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: ResetPasswordSchema,
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
      description: "Password reset successfully",
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
      description: "Error Response when operation fails",
    },
    401: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Error Response when user is not authenticated",
    },
  },
})

export const sendForgetPasswordEmail = createRoute({
  method: "post",
  path: "/send",
  summary: "Forget Password Email",
  tags: ["Password Reset"],
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
          schema: MessageResponseSchema,
        },
      },
      description: "Send Forget Password Email",
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
      description: "Error response when Email service fails",
    },
  },
})

export const forgetPassword = createRoute({
  method: "post",
  path: "/forget",
  summary: "Forget Password",
  tags: ["Password Reset"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: ForgetPassowrdSchema,
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
      description: "Password reset successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Error Response when verification code is wrong or expired",
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
      description: "Error Response when Email is wrong",
    },
  },
})
