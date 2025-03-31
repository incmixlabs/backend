import { describe, expect, it, vi, beforeEach } from "vitest"
import filesRoutes from "@/routes/files"
import { Hono } from "hono"
import { S3 } from "@/lib/s3"
import { envVars } from "@/env-vars"
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsCommand,
  PutObjectCommand
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { Upload } from "@aws-sdk/lib-storage"

// Mock dependencies
vi.mock("@/lib/s3")
vi.mock("@aws-sdk/s3-request-presigner")
vi.mock("@aws-sdk/lib-storage")
vi.mock("@/env-vars", () => ({
  envVars: {
    BUCKET_NAME: "test-bucket",
    PORT: "3000"
  }
}))

// Mock translation function
vi.mock("@incmix-api/utils/middleware", () => ({
  useTranslation: vi.fn().mockImplementation(() => ({
    text: vi.fn().mockImplementation((key) => Promise.resolve(`translated:${key}`))
  }))
}))

// Mock the Upload class
vi.mock("@aws-sdk/lib-storage", () => {
  const mockUpload = vi.fn()
  mockUpload.prototype.on = vi.fn().mockReturnThis()
  mockUpload.prototype.done = vi.fn().mockResolvedValue({})
  
  return {
    Upload: mockUpload
  }
})

describe("Files Routes", () => {
  let app: Hono
  let mockContext: any

  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks()
    
    // Create test app
    app = new Hono()
    app.route("/api/files", filesRoutes)
    
    // Mock getSignedUrl
    vi.mocked(getSignedUrl).mockResolvedValue("https://presigned-url.example.com")
    
    // Mock S3.send for different commands
    vi.mocked(S3.send).mockImplementation((command) => {
      if (command instanceof HeadObjectCommand) {
        return Promise.resolve({ ContentLength: 1024 })
      }
      if (command instanceof GetObjectCommand) {
        return Promise.resolve({
          Body: {
            transformToWebStream: vi.fn().mockReturnValue(new ReadableStream())
          }
        })
      }
      if (command instanceof ListObjectsCommand) {
        return Promise.resolve({
          Contents: [
            { Key: "file1.txt", Size: 100, LastModified: new Date() },
            { Key: "file2.txt", Size: 200, LastModified: new Date() }
          ]
        })
      }
      if (command instanceof DeleteObjectCommand) {
        return Promise.resolve({ DeleteMarker: true })
      }
      return Promise.resolve({})
    })
    
    // Basic mock context
    mockContext = {
      req: {
        query: vi.fn().mockReturnValue("test-file.txt"),
        valid: vi.fn().mockReturnValue({ fileName: "test-file.txt" }),
        header: vi.fn().mockReturnValue("text/plain"),
        raw: {
          arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(10))
        }
      },
      get: vi.fn().mockReturnValue({ id: "user-1" }), // mock auth
      json: vi.fn().mockReturnValue({ status: 200 }),
      status: vi.fn().mockReturnThis(),
      res: {
        headers: {
          set: vi.fn()
        }
      }
    }
  })

  describe("presignedUpload", () => {
    it("should return a presigned URL for upload", async () => {
      // Execute the route handler
      const handler = filesRoutes.routes.find(r => 
        r.path === "/presigned-upload" && r.method === "GET"
      )?.handler
      
      expect(handler).toBeDefined()
      await handler?.(mockContext as any)
      
      // Verify S3 client was used with correct command
      expect(getSignedUrl).toHaveBeenCalledWith(
        S3,
        expect.any(PutObjectCommand),
        { expiresIn: 3600 }
      )
      
      // Verify response
      expect(mockContext.json).toHaveBeenCalledWith(
        { url: "https://presigned-url.example.com" },
        200
      )
    })
    
    it("should throw unauthorized error if user is not authenticated", async () => {
      // Mock missing user
      mockContext.get.mockReturnValue(undefined)
      
      // Execute the route handler
      const handler = filesRoutes.routes.find(r => 
        r.path === "/presigned-upload" && r.method === "GET"
      )?.handler
      
      // Execute handler and catch error
      const processErrorMock = vi.fn().mockResolvedValue("error response")
      vi.mock("@incmix-api/utils/errors", async () => {
        const actual = await vi.importActual("@incmix-api/utils/errors")
        return {
          ...actual,
          processError: processErrorMock,
          UnauthorizedError: class UnauthorizedError extends Error {}
        }
      })
      
      await handler?.(mockContext as any)
      
      // Verify error was processed
      expect(processErrorMock).toHaveBeenCalled()
    })
  })

  describe("presignedDownload", () => {
    it("should return a presigned URL for download", async () => {
      // Execute the route handler
      const handler = filesRoutes.routes.find(r => 
        r.path === "/presigned-download" && r.method === "GET"
      )?.handler
      
      expect(handler).toBeDefined()
      await handler?.(mockContext as any)
      
      // Verify S3 client was used with correct command
      expect(getSignedUrl).toHaveBeenCalledWith(
        S3,
        expect.any(GetObjectCommand),
        { expiresIn: 3600 }
      )
      
      // Verify response
      expect(mockContext.json).toHaveBeenCalledWith(
        { url: "https://presigned-url.example.com" },
        200
      )
    })
  })

  describe("listFiles", () => {
    it("should return a list of files from the bucket", async () => {
      // Execute the route handler
      const handler = filesRoutes.routes.find(r => 
        r.path === "/list" && r.method === "GET"
      )?.handler
      
      expect(handler).toBeDefined()
      await handler?.(mockContext as any)
      
      // Verify S3 client was used with correct command
      expect(S3.send).toHaveBeenCalledWith(
        expect.any(ListObjectsCommand)
      )
      
      // Verify response structure
      expect(mockContext.json).toHaveBeenCalledWith(
        {
          files: expect.arrayContaining([
            expect.objectContaining({
              name: "file1.txt",
              size: 100,
              uploaded: expect.any(String)
            })
          ])
        },
        200
      )
    })
  })

  describe("uploadFile", () => {
    it("should upload file to S3", async () => {
      // Execute the route handler
      const handler = filesRoutes.routes.find(r => 
        r.path === "/upload" && r.method === "POST"
      )?.handler
      
      expect(handler).toBeDefined()
      await handler?.(mockContext as any)
      
      // Verify Upload was initialized with correct params
      expect(Upload).toHaveBeenCalledWith(expect.objectContaining({
        client: S3,
        params: expect.objectContaining({
          Bucket: "test-bucket",
          Key: "test-file.txt",
          Body: expect.any(Blob),
          ContentType: "text/plain"
        })
      }))
      
      // Verify Upload.done was called
      expect(Upload.prototype.done).toHaveBeenCalled()
      
      // Verify response
      expect(mockContext.json).toHaveBeenCalledWith(
        { message: expect.stringContaining("translated:") },
        200
      )
    })
  })

  describe("deleteFile", () => {
    it("should delete file from S3", async () => {
      // Execute the route handler
      const handler = filesRoutes.routes.find(r => 
        r.path === "/delete" && r.method === "DELETE"
      )?.handler
      
      expect(handler).toBeDefined()
      await handler?.(mockContext as any)
      
      // Verify HeadObject was called to check if file exists
      expect(S3.send).toHaveBeenCalledWith(
        expect.any(HeadObjectCommand)
      )
      
      // Verify DeleteObject was called
      expect(S3.send).toHaveBeenCalledWith(
        expect.any(DeleteObjectCommand)
      )
      
      // Verify response
      expect(mockContext.json).toHaveBeenCalledWith(
        { message: expect.stringContaining("translated:") },
        200
      )
    })
  })
})