import { getS3Client } from "@/index"
import {
  ERROR_FILENAME_REQ,
  ERROR_FILE_NOT_FOUND,
  ERROR_R2_BUCKET,
  ERROR_R2_MISSING,
  ERROR_UPLOAD_FAIL,
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

import { stream } from "hono/streaming"

const filesRoutes = new OpenAPIHono<HonoApp>({
  defaultHook: zodError,
})
filesRoutes.openapi(uploadFile, async (c) => {
  try {
    const t = await useTranslation(c)
    if (!c.env.PORT) {
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

    const res = await c.env.MY_BUCKET.put(fileName, body, {
      httpMetadata: {
        contentType: contentType,
      },
    })

    if (!res) {
      const msg = await t.text(ERROR_UPLOAD_FAIL)
      return c.json({ message: msg }, 500)
    }
    const msg = await t.text(FILE_UPLOAD_SUCCESS)
    return c.json({ message: msg }, 200)
  } catch (error) {
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
    if (!c.env.PORT) {
      const msg = await t.text(ERROR_NOT_IMPL)
      throw new ServerError(msg)
    }

    const { fileName } = c.req.valid("query")

    if (!fileName) {
      const msg = await t.text(ERROR_FILENAME_REQ)
      throw new BadRequestError(msg)
    }

    const file = await c.env.MY_BUCKET.get(fileName)
    if (!file) {
      const msg = await t.text(ERROR_FILE_NOT_FOUND)
      return c.json({ message: msg }, 404)
    }

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
      await stream.pipe(file.body)
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
    if (!c.env.PORT) {
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

    const file = await c.env.MY_BUCKET.head(fileName)
    if (!file) {
      const msg = await t.text(ERROR_FILE_NOT_FOUND)
      throw new NotFoundError(msg)
    }
    await c.env.MY_BUCKET.delete(fileName)
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
    if (!c.env.PORT) {
      const msg = await t.text(ERROR_NOT_IMPL)
      throw new ServerError(msg)
    }

    const user = c.get("user")
    if (!user) {
      const msg = await t.text(ERROR_UNAUTHORIZED)
      throw new UnauthorizedError(msg)
    }

    const objects = await c.env.MY_BUCKET.list()
    const files = objects.objects.map((obj) => ({
      name: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
    }))

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

    if (!c.env.MY_BUCKET || !c.env.BUCKET_NAME) {
      const msg = await t.text(ERROR_R2_MISSING)
      throw new ServerError(msg)
    }

    const s3Client = await getS3Client(c)

    const { fileName } = c.req.valid("query")

    if (!fileName) {
      const msg = await t.text(ERROR_FILENAME_REQ)
      throw new BadRequestError(msg)
    }

    if (c.env.PORT) {
      // For local development, return a local URL
      const localUrl = `http://127.0.0.1:${
        c.env.PORT
      }/api/files/upload?fileName=${encodeURIComponent(fileName)}`
      return c.json({ url: localUrl }, 200)
    }

    const command = new PutObjectCommand({
      Bucket: c.env.BUCKET_NAME,
      Key: fileName,
    })
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

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

    if (!c.env.MY_BUCKET || !c.env.BUCKET_NAME) {
      const msg = await t.text(ERROR_R2_BUCKET)

      throw new ServerError(msg)
    }

    const { fileName } = c.req.valid("query")

    if (!fileName) {
      const msg = await t.text(ERROR_FILENAME_REQ)

      throw new BadRequestError(msg)
    }

    if (c.env.PORT) {
      // The date is used to invalidate the cache after the file has been updated.
      const date = new Date().toISOString()
      // For local development, return a local URL
      const localUrl = `http://127.0.0.1:${
        c.env.PORT
      }/api/files/download?fileName=${encodeURIComponent(
        fileName
      )}&date=${date}`
      return c.json({ url: localUrl }, 200)
    }

    const s3Client = await getS3Client(c)
    const command = new GetObjectCommand({
      Bucket: c.env.BUCKET_NAME,
      Key: fileName,
    })
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

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

    if (!c.env.MY_BUCKET || !c.env.BUCKET_NAME) {
      const msg = await t.text(ERROR_R2_BUCKET)

      throw new ServerError(msg)
    }

    const { fileName } = c.req.valid("query")

    if (!fileName) {
      const msg = await t.text(ERROR_FILENAME_REQ)

      throw new BadRequestError(msg)
    }

    if (c.env.PORT) {
      // For local development, return a local URL
      const localUrl = `http://127.0.0.1:${
        c.env.PORT
      }/api/files/delete?fileName=${encodeURIComponent(fileName)}`
      return c.json({ url: localUrl }, 200)
    }

    const s3Client = await getS3Client(c)
    const command = new DeleteObjectCommand({
      Bucket: c.env.BUCKET_NAME,
      Key: fileName,
    })
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

    return c.json({ url }, 200)
  } catch (error) {
    return await processError<typeof presignedDelete>(c, error, [
      "{{ default }}",
      "presigned-delete",
    ])
  }
})

export default filesRoutes
