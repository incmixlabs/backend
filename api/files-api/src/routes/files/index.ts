import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3"
import { Upload } from "@aws-sdk/lib-storage"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { ERROR_NOT_IMPL, ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import {
  BadRequestError,
  NotFoundError,
  processError,
  ServerError,
  UnauthorizedError,
} from "@incmix-api/utils/errors"
import { useTranslation } from "@incmix-api/utils/middleware"
import type { FastifyInstance, FastifyPlugin } from "fastify"
import fp from "fastify-plugin"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { envVars } from "@/env-vars"
import {
  ERROR_FILE_NOT_FOUND,
  ERROR_FILENAME_REQ,
  FILE_DELETE_SUCCESS,
  FILE_UPLOAD_SUCCESS,
} from "@/lib/constants"
import { S3 } from "@/lib/s3"
import {
  deleteFileSchema,
  downloadFileSchema,
  listFilesSchema,
  presignedDeleteSchema,
  presignedDownloadSchema,
  presignedUploadSchema,
  uploadFileSchema,
} from "./openapi"

const filesRoutes: FastifyPlugin = (
  fastify: FastifyInstance,
  _options: any
) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  // Upload File
  app.put("/upload", { schema: uploadFileSchema }, async (request, reply) => {
    try {
      const t = await useTranslation(request)
      if (!envVars.PORT) {
        const msg = await t.text(ERROR_NOT_IMPL)
        throw new ServerError(msg)
      }

      const { fileName } = request.query
      if (!fileName) {
        const msg = await t.text(ERROR_FILENAME_REQ)
        throw new BadRequestError(msg)
      }

      // For file uploads, we expect multipart form data or raw buffer
      // In this case, the body contains the file data directly
      const body = request.body as any
      const buffer = body?.file || (request.body as unknown as Buffer)
      if (!buffer) {
        throw new BadRequestError("File body is required")
      }

      const upload = new Upload({
        client: S3,
        params: {
          Bucket: envVars.BUCKET_NAME,
          Key: fileName,
          Body: buffer,
        },
      })

      await upload.done()

      const msg = await t.text(FILE_UPLOAD_SUCCESS)
      return reply.status(200).send({ message: msg })
    } catch (error) {
      return processError(request, reply, error)
    }
  })

  // Download File
  app.get(
    "/download",
    { schema: downloadFileSchema },
    async (request, reply) => {
      try {
        const t = await useTranslation(request)
        if (!envVars.PORT) {
          const msg = await t.text(ERROR_NOT_IMPL)
          return reply.status(501).send({ error: msg })
        }

        const { fileName } = request.query
        if (!fileName) {
          const msg = await t.text(ERROR_FILENAME_REQ)
          return reply.status(400).send({ error: msg })
        }

        const command = new GetObjectCommand({
          Bucket: envVars.BUCKET_NAME,
          Key: fileName,
        })

        const response = await S3.send(command)

        if (!response.Body) {
          const msg = await t.text(ERROR_FILE_NOT_FOUND)
          return reply.status(404).send({ error: msg })
        }

        // Set headers for file download
        reply.type("application/octet-stream")
        reply.header(
          "Content-Disposition",
          `attachment; filename="${fileName}"`
        )

        // Stream the file
        const stream = response.Body as NodeJS.ReadableStream
        return reply.send(stream)
      } catch (error) {
        return processError(request, reply, error)
      }
    }
  )

  // List Files
  app.get("/list", { schema: listFilesSchema }, async (request, reply) => {
    try {
      const user = request.user
      const t = await useTranslation(request)

      if (!user) {
        const msg = await t.text(ERROR_UNAUTHORIZED)
        throw new UnauthorizedError(msg)
      }

      if (!envVars.PORT) {
        const msg = await t.text(ERROR_NOT_IMPL)
        return reply.status(501).send({ error: msg })
      }

      const command = new ListObjectsCommand({
        Bucket: envVars.BUCKET_NAME,
      })

      const response = await S3.send(command)
      const files =
        response.Contents?.map((object) => ({
          name: object.Key || "",
          size: object.Size || 0,
          uploaded: object.LastModified?.toISOString() || "",
        })) || []

      return reply.status(200).send({ files })
    } catch (error) {
      return processError(request, reply, error)
    }
  })

  // Delete File
  app.delete(
    "/delete",
    { schema: deleteFileSchema },
    async (request, reply) => {
      try {
        const user = request.user
        const t = await useTranslation(request)

        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        if (!envVars.PORT) {
          const msg = await t.text(ERROR_NOT_IMPL)
          return reply.status(501).send({ error: msg })
        }

        const { fileName } = request.query
        if (!fileName) {
          const msg = await t.text(ERROR_FILENAME_REQ)
          throw new BadRequestError(msg)
        }

        try {
          // Check if file exists
          const headCommand = new HeadObjectCommand({
            Bucket: envVars.BUCKET_NAME,
            Key: fileName,
          })
          await S3.send(headCommand)
        } catch (_error) {
          const msg = await t.text(ERROR_FILE_NOT_FOUND)
          throw new NotFoundError(msg)
        }

        const deleteCommand = new DeleteObjectCommand({
          Bucket: envVars.BUCKET_NAME,
          Key: fileName,
        })

        await S3.send(deleteCommand)

        const msg = await t.text(FILE_DELETE_SUCCESS)
        return reply.status(200).send({ message: msg })
      } catch (error) {
        return processError(request, reply, error)
      }
    }
  )

  // Presigned Upload URL
  app.get(
    "/presigned-upload",
    { schema: presignedUploadSchema },
    async (request, reply) => {
      try {
        const user = request.user
        const t = await useTranslation(request)

        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        const { fileName } = request.query
        if (!fileName) {
          const msg = await t.text(ERROR_FILENAME_REQ)
          throw new BadRequestError(msg)
        }

        const command = new PutObjectCommand({
          Bucket: envVars.BUCKET_NAME,
          Key: fileName,
        })

        const url = await getSignedUrl(S3, command, { expiresIn: 3600 })

        return reply.status(200).send({ url })
      } catch (error) {
        return processError(request, reply, error)
      }
    }
  )

  // Presigned Download URL
  app.get(
    "/presigned-download",
    { schema: presignedDownloadSchema },
    async (request, reply) => {
      try {
        const user = request.user
        const t = await useTranslation(request)

        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        const { fileName } = request.query
        if (!fileName) {
          const msg = await t.text(ERROR_FILENAME_REQ)
          throw new BadRequestError(msg)
        }

        const command = new GetObjectCommand({
          Bucket: envVars.BUCKET_NAME,
          Key: fileName,
        })

        const url = await getSignedUrl(S3, command, { expiresIn: 3600 })

        return reply.status(200).send({ url })
      } catch (error) {
        return processError(request, reply, error)
      }
    }
  )

  // Presigned Delete URL
  app.get(
    "/presigned-delete",
    { schema: presignedDeleteSchema },
    async (request, reply) => {
      try {
        const user = request.user
        const t = await useTranslation(request)

        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        const { fileName } = request.query
        if (!fileName) {
          const msg = await t.text(ERROR_FILENAME_REQ)
          throw new BadRequestError(msg)
        }

        const command = new DeleteObjectCommand({
          Bucket: envVars.BUCKET_NAME,
          Key: fileName,
        })

        const url = await getSignedUrl(S3, command, { expiresIn: 3600 })

        return reply.status(200).send({ url })
      } catch (error) {
        return processError(request, reply, error)
      }
    }
  )
}

export default fp(filesRoutes)
