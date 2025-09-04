import { createRoute } from "@hono/zod-openapi"
import { AuthUserSessionSchema } from "@incmix/utils/types"
import { OAuthCallbackSchema, OAuthResponseSchema } from "@/routes/oauth/types"
import { MessageResponseSchema } from "@/routes/types"

export const googleOAuth = createRoute({
  method: "get",
  path: "/",
  summary: "Google Auth URl",
  tags: ["Google OAuth"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: OAuthResponseSchema,
        },
      },
      description: "Returns Authorization Url for Google OAuth",
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

export const googleCallback = createRoute({
  method: "get",
  path: "/callback",
  summary: "Google Callback",
  tags: ["Google OAuth"],
  request: {
    query: OAuthCallbackSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: AuthUserSessionSchema as any },
      },
      description: "Login Successful",
    },
    400: {
      content: {
        "application/json": { schema: MessageResponseSchema },
      },
      description: "Login Failed",
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
