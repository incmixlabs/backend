import { z } from "@hono/zod-openapi"

export const MessageResponseSchema = z
  .object({
    message: z.string().openapi({
      example: "Successful",
    }),
  })
  .openapi("Response")

export type MessageResponse = z.infer<typeof MessageResponseSchema>

export const EmailSchema = z
  .object({
    email: z.string().email().openapi({ example: "john.doe@example.com" }),
  })
  .openapi("Send Email")

export const PresignedUrlSchema = z
  .object({
    url: z.string().openapi({ example: "https://example.com/image.jpg" }),
  })
  .openapi("Presigned Url")
