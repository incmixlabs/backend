import { PaginationMeta } from "@incmix/utils/data-table"
import { TranslationTypes } from "@incmix-api/utils/db-schema"
import { z } from "zod"

export const MessageSchema = z.object({
  id: z.number(),
  locale: z.string({ message: "Locale is Required" }),
  key: z.string({ message: "Key is Required" }),
  value: z.string({ message: "Value is Required" }),
  namespace: z.string({ message: "Namespace is Required" }),
  type: z.enum(TranslationTypes, { message: "Type is Required" }),
})

export const PaginatedMessageSchema = z.object({
  results: MessageSchema.array(),
  metadata: PaginationMeta,
})

export const NamespaceSchema = z.record(z.string(), z.string())
