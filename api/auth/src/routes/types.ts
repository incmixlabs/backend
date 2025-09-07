import { z } from "zod"

export const MessageResponseSchema = z.object({
  message: z.string(),
})

export type MessageResponse = z.infer<typeof MessageResponseSchema>

export const EmailSchema = z.object({
  email: z.string().email(),
})

export const PresignedUrlSchema = z.object({
  url: z.string(),
})
