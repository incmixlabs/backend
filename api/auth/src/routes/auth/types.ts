import { z } from "zod"

export const SignupSchema = z.object({
  fullName: z.string(),
  email: z.string().email(),
  password: z.string().min(1),
})

export const AuthSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const IdOrEmailSchema = z
  .object({
    id: z.string().nullish().default(null),
    email: z.string().email().nullish().default(null),
  })
  .refine(({ id, email }) => {
    return id || email
  }, "Provide either ID or Email")

export const EmailSchema = z.object({
  email: z.string().email(),
})

export const IsEmailVerifiedSchema = z.object({
  isEmailVerified: z.boolean(),
})
