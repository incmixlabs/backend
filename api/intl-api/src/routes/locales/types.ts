import { z } from "zod"

export const LocaleSchema = z.object({
  code: z
    .string({ message: "Code is required" })

    .min(2, "Code must be at least 2 characters long"),
  isDefault: z.boolean().default(false),
})
