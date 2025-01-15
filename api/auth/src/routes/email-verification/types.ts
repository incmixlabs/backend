import { z } from "@hono/zod-openapi"

export const EmailVerificationSchema = z
  .object({
    code: z.string().min(1).openapi({ example: "12345678" }),
    email: z.string().email().openapi({ example: "john.doe@example.com" }),
  })
  .openapi("Email Verification")
