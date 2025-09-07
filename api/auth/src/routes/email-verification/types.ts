import { z } from "zod"

export const EmailVerificationSchema = z.object({
  code: z.string().min(1),
  email: z.string().email(),
})
