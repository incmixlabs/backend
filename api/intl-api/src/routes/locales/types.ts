import { z } from "@hono/zod-openapi"

export const LocaleSchema = z
  .object({
    code: z
      .string({ required_error: "Code is required" })
      .openapi({ example: "en" })
      .min(2, "Code must be at least 2 characters long"),
    isDefault: z.boolean().default(false).openapi({ example: true }),
  })
  .openapi("Locale Schema")
