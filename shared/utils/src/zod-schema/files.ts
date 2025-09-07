import { z } from "zod"
export const UploadFileSchema = z.object({
  file: z.any(),
})
