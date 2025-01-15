import { z } from "@hono/zod-openapi"
export const MessageResponseSchema = z
  .object({
    message: z.string().openapi({
      example: "Successful",
    }),
  })
  .openapi("Response")
