import { z } from "@hono/zod-openapi"
export const UploadFileSchema = z
  .object({
    file: z.any().openapi({}),
  })
  .openapi("Upload File")
