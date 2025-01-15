import { z } from "@hono/zod-openapi"

export const UploadFileSchema = z
  .object({
    file: z.instanceof(ArrayBuffer).openapi({
      type: "string",
      format: "binary",
    }),
  })
  .openapi("Upload File")

export const ListFilesSchema = z
  .object({
    files: z
      .array(
        z.object({
          name: z.string().openapi({ example: "example.txt" }),
          size: z.number().openapi({ example: 100 }),
          uploaded: z.string().openapi({ example: new Date().toISOString() }),
        })
      )
      .openapi({
        example: [
          {
            name: "example.txt",
            size: 100,
            uploaded: new Date().toISOString(),
          },
        ],
      }),
  })
  .openapi("List Files")

export const QueryFileName = z
  .object({
    fileName: z.string().openapi({ example: "example.txt" }),
    // The date is optional, and is used to invalidate the cache after the file has been updated.
    date: z.string().optional().openapi({ example: new Date().toISOString() }),
  })
  .openapi("Query file name")

export const ResponseSchema = z
  .object({
    message: z.string().openapi({
      example: "Successful",
    }),
  })
  .openapi("Response")
