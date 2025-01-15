import { z } from "@hono/zod-openapi"

export const LocaleSchema = z
  .object({
    code: z
      .string({ required_error: "Code is required" })
      .openapi({ example: "en" }),
    isDefault: z.boolean().default(false).openapi({ example: true }),
  })
  .openapi("Locale Schema")
