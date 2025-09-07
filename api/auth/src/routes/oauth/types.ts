import { z } from "zod"

export const OAuthCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
})

export const OAuthResponseSchema = z.object({ authUrl: z.string() })
