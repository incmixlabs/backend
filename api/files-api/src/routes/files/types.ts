import { z } from "zod"

export const UploadFileSchema = z.object({
  file: z.any(), // File upload will be handled by multipart
})

export const ListFilesSchema = z.object({
  files: z.array(
    z.object({
      name: z.string(),
      size: z.number(),
      uploaded: z.string(),
    })
  ),
})

export const QueryFileNameSchema = z.object({
  fileName: z.string(),
  date: z.string().optional(),
})

export const ResponseSchema = z.object({
  message: z.string(),
})

export const PresignedUrlSchema = z.object({
  url: z.string(),
})

export const FileNameParamSchema = z.object({
  fileName: z.string(),
})
