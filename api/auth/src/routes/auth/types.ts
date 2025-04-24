import { z } from "@hono/zod-openapi"

export const SignupSchema = z
  .object({
    fullName: z.string().openapi({ example: "John Doe" }),
    email: z.string().email().openapi({ example: "john.doe@example.com" }),
    password: z.string().min(1).openapi({ example: "12345678" }),
  })
  .openapi("Signup")

export const AuthSchema = z
  .object({
    email: z.string().email().openapi({ example: "john.doe@example.com" }),
    password: z.string().min(1).openapi({ example: "12345678" }),
  })
  .openapi("Auth")

export const IdOrEmailSchema = z
  .object({
    id: z
      .string()
      .nullish()
      .default(null)
      .openapi({ example: "93jpbulpkkavxnz" }),
    email: z
      .string()
      .email()
      .nullish()
      .default(null)
      .openapi({ example: "john.doe@example.com" }),
  })
  .refine(({ id, email }) => {
    return id || email
  }, "Provide either ID or Email")

export const EmailSchema = z
  .object({
    email: z.string().email().openapi({ example: "john.doe@example.com" }),
  })
  .openapi("Email")

export const IsEmailVerifiedSchema = z
  .object({
    isEmailVerified: z.boolean().openapi({ example: true }),
  })
  .openapi("IsEmailVerified")
