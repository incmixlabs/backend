import { z } from "@hono/zod-openapi"

export const OAuthCallbackSchema = z.object({
  code: z.string().min(1).openapi({ example: "12h1jhsadkh12" }),
  state: z.string().min(1).openapi({ example: "12313khjsadka1231" }),
})

export const OAuthResponseSchema = z
  .object({ authUrl: z.string() })
  .openapi("OAuthResponse")
