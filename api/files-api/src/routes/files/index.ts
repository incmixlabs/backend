import {
  ERROR_FILENAME_REQ,
  ERROR_FILE_DELETE_FAIL,
  ERROR_FILE_NOT_FOUND,
  FILE_DELETE_SUCCESS,
  FILE_UPLOAD_SUCCESS,
} from "@/lib/constants"
import {
  deleteFile,
  downloadFile,
  listFiles,
  presignedDelete,
  presignedDownload,
  presignedUpload,
  uploadFile,
} from "@/routes/files/openapi"
import type { HonoApp } from "@/types"
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { OpenAPIHono } from "@hono/zod-openapi"
import {
  BadRequestError,
  NotFoundError,
  ServerError,
  UnauthorizedError,
  processError,
  zodError,
} from "@incmix-api/utils/errors"

import { ERROR_NOT_IMPL, ERROR_UNAUTHORIZED } from "@incmix-api/utils"
import { useTranslation } from "@incmix-api/utils/middleware"

import { envVars } from "@/env-vars"
import { S3 } from "@/lib/s3"
import { Upload } from "@aws-sdk/lib-storage"
import { stream } from "hono/streaming"

const filesRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})
filesRoutes.openapi(uploadFile, async (c) => {
  try {
    const t = await useTranslation(c)
    if (!envVars.PORT) {
      const msg = await t.text(ERROR_NOT_IMPL)
      throw new ServerError(msg)
    }

    const fileName = c.req.query("fileName")
    if (!fileName) {
      const msg = await t.text(ERROR_FILENAME_REQ)
      throw new BadRequestError(msg)
    }

    const contentType =
      c.req.header("Content-Type") || "application/octet-stream"

    const body = await c.req.raw.arrayBuffer()

    const upload = new Upload({
      client: S3,
      params: {
        Bucket: envVars.BUCKET_NAME,
        Key: fileName,
        Body: new Blob([body]),
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
    return c.json({ message: msg }, 200)
  } catch (error) {
    console.log("aws error", error)
    return await processError<typeof uploadFile>(c, error, [
      "{{ default }}",
      "upload-file",
    ])
  }
})

//@ts-expect-error
filesRoutes.openapi(downloadFile, async (c) => {
  try {
    const t = await useTranslation(c)
    if (!envVars.PORT) {
      const msg = await t.text(ERROR_NOT_IMPL)
      throw new ServerError(msg)
    }

    const { fileName } = c.req.valid("query")

    if (!fileName) {
      const msg = await t.text(ERROR_FILENAME_REQ)
      throw new BadRequestError(msg)
    }

    const command = new GetObjectCommand({
      Bucket: envVars.BUCKET_NAME,
      Key: fileName,
    })

    const file = await S3.send(command)

    c.res.headers.set("Content-Type", "application/octet-stream")
    c.res.headers.set(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    )
    c.status(200)

    return stream(c, async (stream) => {
      stream.onAbort(() => {
        console.log("Stream aborted")
      })

      if (!file.Body) {
        const msg = await t.text(ERROR_FILE_NOT_FOUND)
        throw new NotFoundError(msg)
      }
      await stream.pipe(file.Body.transformToWebStream())
    })
  } catch (error) {
    return await processError<typeof downloadFile>(c, error, [
      "{{ default }}",
      "download-file",
    ])
  }
})

filesRoutes.openapi(deleteFile, async (c) => {
  try {
    const t = await useTranslation(c)
    if (!envVars.PORT) {
      const msg = await t.text(ERROR_NOT_IMPL)
      throw new ServerError(msg)
    }

    const user = c.get("user")
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }
    const { fileName } = c.req.valid("query")

    if (!fileName) {
      const msg = await t.text(ERROR_FILENAME_REQ)
      throw new BadRequestError(msg)
    }

    const command = new HeadObjectCommand({
      Bucket: envVars.BUCKET_NAME,
      Key: fileName,
    })

    const file = await S3.send(command)
    if (!file.ContentLength) {
      const msg = await t.text(ERROR_FILE_NOT_FOUND)
      throw new NotFoundError(msg)
    }

    const deletedFile = await S3.send(
      new DeleteObjectCommand({
        Bucket: envVars.BUCKET_NAME,
        Key: fileName,
      })
    )
    if (!deletedFile.DeleteMarker) {
      const msg = await t.text(ERROR_FILE_DELETE_FAIL)
      throw new ServerError(msg)
    }
    const msg = await t.text(FILE_DELETE_SUCCESS)
    return c.json({ message: msg }, 200)
  } catch (error) {
    return await processError<typeof deleteFile>(c, error, [
      "{{ default }}",
      "delete-file",
    ])
  }
})

filesRoutes.openapi(listFiles, async (c) => {
  try {
    const t = await useTranslation(c)
    if (!envVars.PORT) {
      const msg = await t.text(ERROR_NOT_IMPL)
      throw new ServerError(msg)
    }

    const user = c.get("user")
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

    return c.json({ files }, 200)
  } catch (error) {
    return await processError<typeof listFiles>(c, error, [
      "{{ default }}",
      "list-files",
    ])
  }
})

filesRoutes.openapi(presignedUpload, async (c) => {
  try {
    const user = c.get("user")

    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { fileName } = c.req.valid("query")

    if (!fileName) {
      const msg = await t.text(ERROR_FILENAME_REQ)
      throw new BadRequestError(msg)
    }

    // if (envVars.PORT) {
    //   // For local development, return a local URL
    //   const localUrl = `http://127.0.0.1:${
    //     envVars.PORT
    //   }/api/files/upload?fileName=${encodeURIComponent(fileName)}`
    //   return c.json({ url: localUrl }, 200)
    // }

    const command = new PutObjectCommand({
      Bucket: envVars.BUCKET_NAME,
      Key: fileName,
    })
    const url = await getSignedUrl(S3, command, { expiresIn: 3600 })

    return c.json({ url }, 200)
  } catch (error) {
    return await processError<typeof presignedUpload>(c, error, [
      "{{ default }}",
      "presigned-upload",
    ])
  }
})

filesRoutes.openapi(presignedDownload, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { fileName } = c.req.valid("query")

    if (!fileName) {
      const msg = await t.text(ERROR_FILENAME_REQ)

      throw new BadRequestError(msg)
    }

    if (envVars.PORT) {
      // The date is used to invalidate the cache after the file has been updated.
      const date = new Date().toISOString()
      // For local development, return a local URL
      const localUrl = `http://127.0.0.1:${
        envVars.PORT
      }/api/files/download?fileName=${encodeURIComponent(
        fileName
      )}&date=${date}`
      return c.json({ url: localUrl }, 200)
    }

    const command = new GetObjectCommand({
      Bucket: envVars.BUCKET_NAME,
      Key: fileName,
    })
    const url = await getSignedUrl(S3, command, { expiresIn: 3600 })

    return c.json({ url }, 200)
  } catch (error) {
    return await processError<typeof presignedDownload>(c, error, [
      "{{ default }}",
      "presigned-download",
    ])
  }
})

filesRoutes.openapi(presignedDelete, async (c) => {
  try {
    const user = c.get("user")
    const t = await useTranslation(c)
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const { fileName } = c.req.valid("query")

    if (!fileName) {
      const msg = await t.text(ERROR_FILENAME_REQ)

      throw new BadRequestError(msg)
    }

    if (envVars.PORT) {
      // For local development, return a local URL
      const localUrl = `http://127.0.0.1:${
        envVars.PORT
      }/api/files/delete?fileName=${encodeURIComponent(fileName)}`
      return c.json({ url: localUrl }, 200)
    }

    const command = new DeleteObjectCommand({
      Bucket: envVars.BUCKET_NAME,
      Key: fileName,
    })
    const url = await getSignedUrl(S3, command, { expiresIn: 3600 })

    return c.json({ url }, 200)
  } catch (error) {
    return await processError<typeof presignedDelete>(c, error, [
      "{{ default }}",
      "presigned-delete",
    ])
  }
})

export default filesRoutes
