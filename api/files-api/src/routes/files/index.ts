import type { Readable } from "node:stream"
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
  ErrorConstants,
  errorStatuses,
  NotFoundError,
  ServerError,
  UnauthorizedError,
} from "@incmix-api/utils/errors"
import { useFastifyTranslation } from "@incmix-api/utils/fastify-bootstrap"

const _errorConstants = new ErrorConstants()

import type { FastifyInstance } from "fastify"
import { envVars } from "@/env-vars"
import {
  ERROR_FILE_DELETE_FAIL,
  ERROR_FILE_NOT_FOUND,
  ERROR_FILENAME_REQ,
  FILE_DELETE_SUCCESS,
  FILE_UPLOAD_SUCCESS,
} from "@/lib/constants"
import { S3 } from "@/lib/s3"
import {
  ListFilesResponseSchema,
  MessageResponseSchema,
  PresignedUrlResponseSchema,
  QueryFileNameSchema,
} from "./schema"

export const setupFilesRoutes = (app: FastifyInstance) => {
  // Upload file endpoint
  app.put(
    "/upload",
    {
      schema: {
        description: "Upload File (Local Development Only)",
        tags: ["files"],
        querystring: QueryFileNameSchema,
        response: {
          200: MessageResponseSchema,
          400: MessageResponseSchema,
          500: MessageResponseSchema,
          501: MessageResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const t = await useFastifyTranslation(request as any)
        if (!envVars.PORT) {
          const msg = await t.text(ERROR_NOT_IMPL)
          throw new ServerError(msg)
        }

        const { fileName } = request.query as { fileName: string }
        if (!fileName) {
          const msg = await t.text(ERROR_FILENAME_REQ)
          throw new BadRequestError(msg)
        }

        const contentType =
          request.headers["content-type"] || "application/octet-stream"

        const _body = await request.raw.read()

        const upload = new Upload({
          client: S3,
          params: {
            Bucket: envVars.BUCKET_NAME,
            Key: fileName,
            Body: request.raw,
            ContentType: contentType,
          },
          queueSize: 4,
          partSize: 10 * 1024 * 1024,
          leavePartsOnError: false,
        })

        upload.on("httpUploadProgress", (progress) => {
          console.log(progress.loaded, progress.total)
        })

        await upload.done()

        const msg = await t.text(FILE_UPLOAD_SUCCESS)
        return reply.code(200).send({ message: msg })
      } catch (error) {
        console.log("aws error", error)
        if (error instanceof BadRequestError) {
          return reply
            .code(errorStatuses.BadRequest.code)
            .send({ message: error.message })
        }
        if (error instanceof ServerError) {
          return reply
            .code(errorStatuses.ServerError.code)
            .send({ message: error.message })
        }
        return reply
          .code(errorStatuses.ServerError.code)
          .send({ message: "Internal Server Error" })
      }
    }
  )

  // Download file endpoint
  app.get(
    "/download",
    {
      schema: {
        description: "Download File (Local Development Only)",
        tags: ["files"],
        querystring: QueryFileNameSchema,
        response: {
          400: MessageResponseSchema,
          401: MessageResponseSchema,
          404: MessageResponseSchema,
          500: MessageResponseSchema,
          501: MessageResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const t = await useFastifyTranslation(request as any)
        if (!envVars.PORT) {
          const msg = await t.text(ERROR_NOT_IMPL)
          throw new ServerError(msg)
        }

        const { fileName } = request.query as { fileName: string }

        if (!fileName) {
          const msg = await t.text(ERROR_FILENAME_REQ)
          throw new BadRequestError(msg)
        }

        const command = new GetObjectCommand({
          Bucket: envVars.BUCKET_NAME,
          Key: fileName,
        })

        let file: any
        try {
          file = await S3.send(command)
        } catch (e: any) {
          const notFound =
            e?.$metadata?.httpStatusCode === errorStatuses.NotFound.code ||
            e?.name === "NoSuchKey" ||
            e?.Code === "NoSuchKey"
          if (notFound) {
            const msg = await t.text(ERROR_FILE_NOT_FOUND)
            throw new NotFoundError(msg)
          }
          throw e
        }
        reply.header("Content-Type", "application/octet-stream")
        reply.header(
          "Content-Disposition",
          `attachment; filename="${fileName}"`
        )

        // Convert AWS SDK v3 stream to Node.js Readable stream
        const stream = file.Body as Readable
        return reply.send(stream)
      } catch (error) {
        const _t = await useFastifyTranslation(request as any)
        if (error instanceof BadRequestError) {
          return reply
            .code(errorStatuses.BadRequest.code)
            .send({ message: error.message })
        }
        if (error instanceof NotFoundError) {
          return reply
            .code(errorStatuses.NotFound.code)
            .send({ message: error.message })
        }
        if (error instanceof ServerError) {
          return reply
            .code(errorStatuses.ServerError.code)
            .send({ message: error.message })
        }
        return reply
          .code(errorStatuses.ServerError.code)
          .send({ message: "Internal Server Error" })
      }
    }
  )

  // Delete file endpoint
  app.delete(
    "/delete",
    {
      schema: {
        description: "Delete File (Local Development Only)",
        tags: ["files"],
        querystring: QueryFileNameSchema,
        response: {
          200: MessageResponseSchema,
          400: MessageResponseSchema,
          401: MessageResponseSchema,
          404: MessageResponseSchema,
          500: MessageResponseSchema,
          501: MessageResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const t = await useFastifyTranslation(request as any)
        if (!envVars.PORT) {
          const msg = await t.text(ERROR_NOT_IMPL)
          throw new ServerError(msg)
        }

        const user = (request as any).user
        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        const { fileName } = request.query as { fileName: string }

        if (!fileName) {
          const msg = await t.text(ERROR_FILENAME_REQ)
          throw new BadRequestError(msg)
        }

        const command = new HeadObjectCommand({
          Bucket: envVars.BUCKET_NAME,
          Key: fileName,
        })
        try {
          await S3.send(command)
        } catch (e: any) {
          const notFound =
            e?.$metadata?.httpStatusCode === errorStatuses.NotFound.code ||
            e?.name === "NoSuchKey" ||
            e?.Code === "NoSuchKey"
          if (notFound) {
            const msg = await t.text(ERROR_FILE_NOT_FOUND)
            throw new NotFoundError(msg)
          }
          throw e
        }

        const deletedFile = await S3.send(
          new DeleteObjectCommand({
            Bucket: envVars.BUCKET_NAME,
            Key: fileName,
          })
        )
        const status = deletedFile.$metadata?.httpStatusCode
        if (status !== 204 && status !== 200) {
          const msg = await t.text(ERROR_FILE_DELETE_FAIL)
          throw new ServerError(msg)
        }
        const msg = await t.text(FILE_DELETE_SUCCESS)
        return reply.code(200).send({ message: msg })
      } catch (error) {
        const _t = await useFastifyTranslation(request as any)
        if (error instanceof BadRequestError) {
          return reply
            .code(errorStatuses.BadRequest.code)
            .send({ message: error.message })
        }
        if (error instanceof UnauthorizedError) {
          return reply
            .code(errorStatuses.Unauthorized.code)
            .send({ message: error.message })
        }
        if (error instanceof NotFoundError) {
          return reply
            .code(errorStatuses.NotFound.code)
            .send({ message: error.message })
        }
        if (error instanceof ServerError) {
          return reply
            .code(errorStatuses.ServerError.code)
            .send({ message: error.message })
        }
        return reply
          .code(errorStatuses.ServerError.code)
          .send({ message: "Internal Server Error" })
      }
    }
  )

  // List files endpoint
  app.get(
    "/list",
    {
      schema: {
        description: "List Files (Local Development Only)",
        tags: ["files"],
        response: {
          200: ListFilesResponseSchema,
          400: MessageResponseSchema,
          401: MessageResponseSchema,
          500: MessageResponseSchema,
          501: MessageResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const t = await useFastifyTranslation(request as any)
        if (!envVars.PORT) {
          const msg = await t.text(ERROR_NOT_IMPL)
          throw new ServerError(msg)
        }

        const user = (request as any).user
        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        const command = new ListObjectsCommand({
          Bucket: envVars.BUCKET_NAME,
        })
        const objects = await S3.send(command)

        const files =
          objects.Contents?.map((obj) => ({
            name: obj.Key ?? "",
            size: obj.Size ?? 0,
            uploaded: obj.LastModified?.toISOString() ?? "",
          })) ?? []

        return reply.code(200).send({ files })
      } catch (error) {
        const _t = await useFastifyTranslation(request as any)
        if (error instanceof BadRequestError) {
          return reply
            .code(errorStatuses.BadRequest.code)
            .send({ message: error.message })
        }
        if (error instanceof UnauthorizedError) {
          return reply
            .code(errorStatuses.Unauthorized.code)
            .send({ message: error.message })
        }
        if (error instanceof ServerError) {
          return reply
            .code(errorStatuses.ServerError.code)
            .send({ message: error.message })
        }
        return reply
          .code(errorStatuses.ServerError.code)
          .send({ message: "Internal Server Error" })
      }
    }
  )

  // Presigned upload URL endpoint
  app.get(
    "/presigned-upload",
    {
      schema: {
        description: "Get Presigned URL for Upload",
        tags: ["files"],
        querystring: QueryFileNameSchema,
        response: {
          200: PresignedUrlResponseSchema,
          400: MessageResponseSchema,
          401: MessageResponseSchema,
          500: MessageResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const t = await useFastifyTranslation(request as any)
        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        const { fileName } = request.query as { fileName: string }

        if (!fileName) {
          const msg = await t.text(ERROR_FILENAME_REQ)
          throw new BadRequestError(msg)
        }

        const command = new PutObjectCommand({
          Bucket: envVars.BUCKET_NAME,
          Key: fileName,
        })
        const url = await getSignedUrl(S3, command, { expiresIn: 3600 })

        return reply.code(200).send({ url })
      } catch (error) {
        const _t = await useFastifyTranslation(request as any)
        if (error instanceof BadRequestError) {
          return reply
            .code(errorStatuses.BadRequest.code)
            .send({ message: error.message })
        }
        if (error instanceof UnauthorizedError) {
          return reply
            .code(errorStatuses.Unauthorized.code)
            .send({ message: error.message })
        }
        return reply
          .code(errorStatuses.ServerError.code)
          .send({ message: "Internal Server Error" })
      }
    }
  )

  // Presigned download URL endpoint
  app.get(
    "/presigned-download",
    {
      schema: {
        description: "Get Presigned URL for Download",
        tags: ["files"],
        querystring: QueryFileNameSchema,
        response: {
          200: PresignedUrlResponseSchema,
          400: MessageResponseSchema,
          401: MessageResponseSchema,
          500: MessageResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const t = await useFastifyTranslation(request as any)
        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        const { fileName } = request.query as { fileName: string }

        if (!fileName) {
          const msg = await t.text(ERROR_FILENAME_REQ)
          throw new BadRequestError(msg)
        }

        const command = new GetObjectCommand({
          Bucket: envVars.BUCKET_NAME,
          Key: fileName,
        })
        const url = await getSignedUrl(S3, command, { expiresIn: 3600 })

        return reply.code(200).send({ url })
      } catch (error) {
        const _t = await useFastifyTranslation(request as any)
        if (error instanceof BadRequestError) {
          return reply
            .code(errorStatuses.BadRequest.code)
            .send({ message: error.message })
        }
        if (error instanceof UnauthorizedError) {
          return reply
            .code(errorStatuses.Unauthorized.code)
            .send({ message: error.message })
        }
        return reply.code(500).send({ message: "Internal Server Error" })
      }
    }
  )

  // Presigned delete URL endpoint
  app.get(
    "/presigned-delete",
    {
      schema: {
        description: "Get Presigned URL for Delete",
        tags: ["files"],
        querystring: QueryFileNameSchema,
        response: {
          200: PresignedUrlResponseSchema,
          400: MessageResponseSchema,
          401: MessageResponseSchema,
          500: MessageResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const t = await useFastifyTranslation(request as any)
        if (!user) {
          const msg = await t.text(ERROR_UNAUTHORIZED)
          throw new UnauthorizedError(msg)
        }

        const { fileName } = request.query as { fileName: string }

        if (!fileName) {
          const msg = await t.text(ERROR_FILENAME_REQ)
          throw new BadRequestError(msg)
        }

        if (envVars.PORT) {
          // For local development, return a local URL
          const localUrl = `http://127.0.0.1:${
            envVars.PORT
          }/api/files/delete?fileName=${encodeURIComponent(fileName)}`
          return reply.code(200).send({ url: localUrl })
        }

        const command = new DeleteObjectCommand({
          Bucket: envVars.BUCKET_NAME,
          Key: fileName,
        })
        const url = await getSignedUrl(S3, command, { expiresIn: 3600 })

        return reply.code(200).send({ url })
      } catch (error) {
        const _t = await useFastifyTranslation(request as any)
        if (error instanceof BadRequestError) {
          return reply
            .code(errorStatuses.BadRequest.code)
            .send({ message: error.message })
        }
        if (error instanceof UnauthorizedError) {
          return reply
            .code(errorStatuses.Unauthorized.code)
            .send({ message: error.message })
        }
        return reply
          .code(errorStatuses.ServerError.code)
          .send({ message: "Internal Server Error" })
      }
    }
  )
}
