import { env } from "cloudflare:test"
import app from "@"
import { BASE_PATH } from "@/lib/constants"
import {
  deleteFile,
  downloadFile,
  listFiles,
  presignedDelete,
  presignedDownload,
  presignedUpload,
  uploadFile,
} from "@/routes/files/openapi"
import type { ListFilesSchema } from "@/routes/files/types"
import { defaultHeaders } from "@/test/test-utils"
import type { presignedUrlSchema } from "@jsprtmnn/utils/types"
import { beforeAll, describe, expect, test } from "vitest"
import type { z } from "zod"

describe("Files worker tests", () => {
  beforeAll(async () => {
    const file = new Blob(["Hello, World!"], { type: "text/plain" })
    await env.MY_BUCKET.put("exists.txt", file)
  })
  describe("Failure tests", () => {
    test("Presigned download for Unauthorized User", async () => {
      const res = await app.request(
        `${BASE_PATH}${presignedDownload.getRoutingPath()}?fileName=test.txt`,
        {
          method: "GET",
          headers: defaultHeaders,
        },
        env
      )

      expect(res.status).toBe(401)
    })

    test("Presigned upload for Unauthorized User", async () => {
      const res = await app.request(
        `${BASE_PATH}${presignedUpload.getRoutingPath()}?fileName=test.txt`,
        {
          method: "GET",
          headers: defaultHeaders,
        },
        env
      )

      expect(res.status).toBe(401)
    })
  })
  describe("Success tests", () => {
    test("Downloading file", async () => {
      const res = await app.request(
        `${BASE_PATH}${downloadFile.getRoutingPath()}?fileName=exists.txt`,
        {
          method: "GET",
          headers: { ...defaultHeaders },
        },
        env
      )

      expect(res.status).toBe(200)
      expect(await res.text()).toBe("Hello, World!")
    })

    test("Uploading file", async () => {
      const fileContent = "file content"
      const fileName = "test.txt"
      const { "content-type": _, ...headers } = defaultHeaders

      const res = await app.request(
        `${BASE_PATH}${uploadFile.getRoutingPath()}?fileName=${fileName}`,
        {
          method: "PUT",
          headers: {
            ...headers,
            "Content-Type": "text/plain",
          },
          body: fileContent,
        },
        env
      )

      expect(res.status).toBe(200)
    })

    test("Presigned download for valid User", async () => {
      const res = await app.request(
        `${BASE_PATH}${presignedDownload.getRoutingPath()}?fileName=exists.txt`,
        {
          method: "GET",
          headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
        },
        env
      )

      expect(res.status).toBe(200)
      const body: z.infer<typeof presignedUrlSchema> = await res.json()
      expect(body).toHaveProperty("url")
      expect(typeof body.url).toBe("string")
      const url = new URL(body.url)

      if (env.PORT) {
        // For local development, check if the URL is a local URL
        expect(url.pathname).toBe("/api/files/download")
        expect(url.searchParams.get("fileName")).toBe("exists.txt")
      } else {
        // For production, the URL should be a valid S3 URL
        expect(url.hostname).toMatch(/^.*\.r2\.cloudflarestorage\.com$/)
      }

      // Test downloading from the presigned URL (for local development)
      const downloadRes = await app.request(
        url.toString(),
        {
          method: "GET",
          headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
        },
        env
      )
      expect(downloadRes.status).toBe(200)
      const content = await downloadRes.text()
      expect(content).toBe("Hello, World!")
    })

    test("Presigned upload for valid User", async () => {
      const res = await app.request(
        `${BASE_PATH}${presignedUpload.getRoutingPath()}?fileName=test_presigned_upload.txt`,
        {
          method: "GET",
          headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
        },
        env
      )

      expect(res.status).toBe(200)
      const body: z.infer<typeof presignedUrlSchema> = await res.json()
      expect(body).toHaveProperty("url")
      expect(typeof body.url).toBe("string")
      const url = new URL(body.url)

      if (env.PORT) {
        // For local development, check if the URL is a local URL
        expect(url.pathname).toBe("/api/files/upload")
        expect(url.searchParams.get("fileName")).toBe(
          "test_presigned_upload.txt"
        )
      } else {
        // For production, the URL should be a valid S3 URL
        expect(url.hostname).toMatch(/^.*\.r2\.cloudflarestorage\.com$/)
      }

      // Test uploading to the presigned URL (for local development)
      const { "content-type": _, ...headers } = defaultHeaders
      const uploadRes = await app.request(
        url.toString(),
        {
          method: "PUT",
          headers: {
            ...headers,
            "Content-Type": "text/plain",
            cookie: `${env.COOKIE_NAME}=user_1`,
          },
          body: "Presigned upload content",
        },
        env
      )
      expect(uploadRes.status).toBe(200)
    })
  })

  describe("List files tests", () => {
    test("Listing files for Unauthorized User", async () => {
      const res = await app.request(
        BASE_PATH + listFiles.getRoutingPath(),
        {
          method: "GET",
          headers: defaultHeaders,
        },
        env
      )

      expect(res.status).toBe(401)
    })

    test("Listing files for valid User", async () => {
      // First, upload a couple of files
      const file1 = new Blob(["file 1 content"], { type: "text/plain" })
      const file2 = new Blob(["file 2 content"], { type: "text/plain" })
      await env.MY_BUCKET.put("file1.txt", file1)
      await env.MY_BUCKET.put("file2.txt", file2)

      const res = await app.request(
        BASE_PATH + listFiles.getRoutingPath(),
        {
          method: "GET",
          headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
        },
        env
      )

      expect(res.status).toBe(200)
      const body: z.infer<typeof ListFilesSchema> = await res.json()
      expect(body).toHaveProperty("files")
      expect(Array.isArray(body.files)).toBe(true)
      expect(body.files.length).toBeGreaterThanOrEqual(2)
      expect(body.files.some((file) => file.name === "file1.txt")).toBe(true)
      expect(body.files.some((file) => file.name === "file2.txt")).toBe(true)
      for (const file of body.files) {
        expect(file).toHaveProperty("name")
        expect(file).toHaveProperty("size")
        expect(file).toHaveProperty("uploaded")
      }
    })
  })

  describe("Delete file tests", () => {
    test("Deleting file for Unauthorized User", async () => {
      const res = await app.request(
        `${BASE_PATH}${deleteFile.getRoutingPath()}?fileName=test.txt`,
        {
          method: "DELETE",
          headers: defaultHeaders,
        },
        env
      )

      expect(res.status).toBe(401)
    })

    test("Deleting file for valid User", async () => {
      // First, upload a file to delete
      const fileName = "test_delete.txt"
      const fileContent = "file to delete"
      const { "content-type": _, ...headers } = defaultHeaders

      const uploadRes = await app.request(
        `${BASE_PATH}${uploadFile.getRoutingPath()}?fileName=${fileName}`,
        {
          method: "PUT",
          headers: {
            ...headers,
            "Content-Type": "text/plain",
            cookie: `${env.COOKIE_NAME}=user_1`,
          },
          body: fileContent,
        },
        env
      )

      expect(uploadRes.status).toBe(200)

      // Now, delete the file
      const deleteRes = await app.request(
        `${BASE_PATH}${deleteFile.getRoutingPath()}?fileName=test_delete.txt`,
        {
          method: "DELETE",
          headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
        },
        env
      )

      expect(deleteRes.status).toBe(200)

      // Verify the file is deleted by trying to download it
      const downloadRes = await app.request(
        `${BASE_PATH}${downloadFile.getRoutingPath()}?fileName=test_delete.txt`,
        {
          method: "GET",
          headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
        },
        env
      )

      expect(downloadRes.status).toBe(404)
    })

    test("Deleting non-existent file", async () => {
      const res = await app.request(
        `${BASE_PATH}${deleteFile.getRoutingPath()}?fileName=non_existent.txt`,
        {
          method: "DELETE",
          headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
        },
        env
      )

      expect(res.status).toBe(404)
    })
  })

  describe("Presigned Delete tests", () => {
    test("Presigned delete for Unauthorized User", async () => {
      const res = await app.request(
        `${BASE_PATH}${presignedDelete.getRoutingPath()}?fileName=test.txt`,
        {
          method: "GET",
          headers: defaultHeaders,
        },
        env
      )

      expect(res.status).toBe(401)
    })

    test("Presigned delete for valid User", async () => {
      // First, upload a file to delete
      const file = new Blob(["file to delete"], { type: "text/plain" })
      await env.MY_BUCKET.put("test_presigned_delete.txt", file)

      const res = await app.request(
        `${BASE_PATH}${presignedDelete.getRoutingPath()}?fileName=test_presigned_delete.txt`,
        {
          method: "GET",
          headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
        },
        env
      )

      expect(res.status).toBe(200)
      const body: z.infer<typeof presignedUrlSchema> = await res.json()
      expect(body).toHaveProperty("url")
      expect(typeof body.url).toBe("string")

      if (env.PORT) {
        // For local development, check if the URL is a local URL
        expect(body.url).toMatch(
          `http://127.0.0.1:${env.PORT}/api/files/delete?fileName=test_presigned_delete.txt`
        )
      } else {
        // For production, the URL should be a valid S3 URL
        expect(body.url).toMatch(
          /^https:\/\/.*\.r2\.cloudflarestorage\.com\/.*/
        )
      }
    })

    test("Presigned delete for non-existent file", async () => {
      const res = await app.request(
        `${BASE_PATH}${presignedDelete.getRoutingPath()}?fileName=non_existent.txt`,
        {
          method: "GET",
          headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
        },
        env
      )

      expect(res.status).toBe(200)
      const body: z.infer<typeof presignedUrlSchema> = await res.json()
      expect(body).toHaveProperty("url")
      expect(typeof body.url).toBe("string")
    })
  })

  // describe("Health Check tests", () => {
  //   let originalSend: typeof S3Client.prototype.send

  //   beforeAll(() => {
  //     originalSend = S3Client.prototype.send
  //   })

  //   afterAll(() => {
  //     S3Client.prototype.send = originalSend
  //   })

  //   test("Health check when R2 bucket is UP", async () => {
  //     S3Client.prototype.send = vi.fn().mockResolvedValue({ Contents: [] })

  //     const res = await app.request(
  //       healthCheck.getRoutingPath(),
  //       {
  //         method: "GET",
  //         headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
  //       },
  //       env
  //     )

  //     expect(res.status).toBe(200)
  //     expect(await res.json()).toEqual({ status: "UP", bucket: "UP" })
  //   })

  //   test("Health check when R2 bucket is DOWN", async () => {
  //     S3Client.prototype.send = vi.fn().mockRejectedValue(new Error("S3 is down"))

  //     const res = await app.request(
  //       healthCheck.getRoutingPath(),
  //       {
  //         method: "GET",
  //         headers: { ...defaultHeaders, cookie: `${env.COOKIE_NAME}=user_1` },
  //       },
  //       env
  //     )

  //     expect(res.status).toBe(200)
  //     expect(await res.json()).toEqual({ status: "UP", bucket: "DOWN" })
  //   })
  // })
})
