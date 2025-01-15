import { z } from "@hono/zod-openapi"

export const ValueSchema = z.object({
  id: z.string().openapi({ example: "93jpbulpkkavxnz" }),
  value: z.boolean().openapi({ example: true }),
})
export const PasswordValueSchema = z.object({
  id: z.string().openapi({ example: "93jpbulpkkavxnz" }),
  value: z.string().min(1).openapi({ example: "12345678" }),
})
