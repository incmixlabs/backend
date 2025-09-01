import { z } from "@hono/zod-openapi"
import { PaginationMeta } from "@incmix/utils/data-table"
import { TranslationTypes } from "@incmix-api/utils/db-schema"

export const MessageSchema = z
  .object({
    id: z.number(),
    locale: z
      .string({ message: "Locale is Required" })
      .openapi({ example: "en" }),
    key: z
      .string({ message: "Key is Required" })
      .openapi({ example: "button_login" }),
    value: z
      .string({ message: "Value is Required" })
      .openapi({ example: "Login" }),
    namespace: z
      .string({ message: "Namespace is Required" })
      .openapi({ example: "auth" }),
    type: z
      .enum(TranslationTypes, { message: "Type is Required" })
      .openapi({ example: "label" }),
  })
  .openapi("Intl Message")

export const PaginatedMessageSchema = z.object({
  results: MessageSchema.array(),
  metadata: PaginationMeta,
})

export const NamespaceSchema = z
  .record(z.string(), z.string())
  .openapi("Namespace Schema", {
    example: {
      logout_success: "Logged out successfully",
    },
  })
