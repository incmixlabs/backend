import { z } from "zod"

export const ResetPasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1),
})

export const ForgetPassowrdSchema = z.object({
  code: z.string().min(1),
  email: z.string().email(),
  newPassword: z.string().min(8),
})
