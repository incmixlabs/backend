import { createRoute } from "@hono/zod-openapi"
import { MessageResponseSchema, RequestSchema } from "./types"

export const sendMail = createRoute({
  method: "post",
  path: "/",
  summary: "Send Mail",
  description: "Send Email based on the template provided",
  request: {
    body: {
      content: {
        "application/json": {
          schema: RequestSchema,
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
  },
})
