import { describe, expect, it, vi } from "vitest"

// Mock environment variables to prevent validation errors
vi.mock("@/env-vars", () => ({
  envVars: {
    INTL_API_URL: "http://localhost:3001",
    AWS_ACCESS_KEY_ID: "test-key",
    AWS_ENDPOINT_URL_S3: "http://localhost:9000",
    AWS_REGION: "us-east-1",
    AWS_SECRET_ACCESS_KEY: "test-secret",
    BUCKET_NAME: "test-bucket",
    AUTH_API_URL: "http://localhost:3000",
    PORT: "3002",
  },
}))

import { setupFilesRoutes } from "@/routes/files"

describe("Files Routes", () => {
  it("should be defined", () => {
    expect(setupFilesRoutes).toBeDefined()
  })

  it("should be a function", () => {
    expect(typeof setupFilesRoutes).toBe("function")
  })
})
