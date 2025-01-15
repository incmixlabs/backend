import { EmailVerificationSchema } from "@/routes/email-verification/types"
import { EmailSchema, MessageResponseSchema } from "@/routes/types"
import { createRoute } from "@hono/zod-openapi"

export const verifyEmail = createRoute({
  method: "post",
  path: "/",
  security: [{ cookieAuth: [] }],
  summary: "Verify Email",
  tags: ["Email Verification"],
  request: {
    body: {
      content: { "application/json": { schema: EmailVerificationSchema } },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: MessageResponseSchema,
        },
      },
      description: "Verifies Email using verification code",
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
      description: "Error Response when verification code is wrong or expired",
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

export const sendVerificationEmail = createRoute({
  method: "post",
  path: "/send",
  summary: "Send Veriication Email",
  tags: ["Email Verification"],
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
      description: "Send Verification Email",
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
