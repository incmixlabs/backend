import { z } from "@hono/zod-openapi"

export const ResetPasswordSchema = z
  .object({
    currentPassword: z.string().min(1).openapi({ example: "12345678" }),
    newPassword: z.string().min(1).openapi({ example: "12345679" }),
  })
  .openapi("Reset Password")

export const ForgetPassowrdSchema = z
  .object({
    code: z.string().min(1).openapi({ example: "12345678" }),
    email: z.string().email().openapi({ example: "john.doe@example.com" }),
    newPassword: z.string().min(8).openapi({ example: "12345678" }),
  })
  .openapi("Forgot Password")
