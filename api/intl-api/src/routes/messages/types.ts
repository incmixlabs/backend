import { MessageTypes } from "@/types"
import { z } from "@hono/zod-openapi"
import { PaginationMeta } from "@incmix/utils/data-table"

export const MessageSchema = z
  .object({
    locale: z
      .string({ required_error: "Locale is Required" })
      .openapi({ example: "en" }),
    key: z
      .string({ required_error: "Key is Required" })
      .openapi({ example: "button_login" }),
    value: z
      .string({ required_error: "Value is Required" })
      .openapi({ example: "Login" }),
    namespace: z
      .string({ required_error: "Namespace is Required" })
      .openapi({ example: "auth" }),
    type: z
      .enum(MessageTypes, { required_error: "Type is Required" })
      .openapi({ example: "label" }),
  })
  .openapi("Intl Message")

export const PaginatedMessageSchema = z.object({
  results: MessageSchema.array(),
  metadata: PaginationMeta,
})

export const NamespaceSchema = z
  .record(z.string())
  .openapi("Namespace Schema", {
    example: {
      logout_success: "Logged out successfully",
    },
  })
