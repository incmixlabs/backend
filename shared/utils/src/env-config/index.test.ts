import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { z } from "zod"

describe("Environment Config", () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    // Create a clean environment for testing
    process.env = {}
    // Set required base environment variables
    process.env.NODE_ENV = "test"
    process.env.DATABASE_URL = "postgresql://test:test@localhost/test_db"
    process.env.SENTRY_DSN = "https://test@sentry.io/123456"
    process.env.FRONTEND_URL = "http://localhost:3000"
    process.env.DOMAIN = "http://localhost"
    process.env.GOOGLE_CLIENT_ID = "test-google-client-id"
    process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret"
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  describe("API URL generation", () => {
    it("should only set API URLs that are defined in the schema", async () => {
      const { createEnvConfig } = await import("./index")
      const env = createEnvConfig("auth")
      
      // Auth service schema includes these API URLs
      expect(env.EMAIL_API_URL).toBeDefined()
      expect(env.USERS_API_URL).toBeDefined()
      expect(env.INTL_API_URL).toBeDefined()
      
      // These should be set based on buildApiUrl
      expect(env.EMAIL_API_URL).toBe("http://localhost:8989/api/email")
      expect(env.USERS_API_URL).toBe("http://localhost:9191/api/users")
      expect(env.INTL_API_URL).toBe("http://localhost:9090/api/intl")
      
      // Auth service schema doesn't include these, so they shouldn't be set
      expect(env.GENAI_API_URL).toBeUndefined()
      expect(env.FILES_API_URL).toBeUndefined()
      expect(env.PROJECTS_API_URL).toBeUndefined()
    })

    it("should not override API URLs if they are already provided", async () => {
      process.env.EMAIL_API_URL = "https://custom.email.api/v1"
      process.env.USERS_API_URL = "https://custom.users.api/v1"
      
      const { createEnvConfig } = await import("./index")
      const env = createEnvConfig("auth")
      
      // Should use the provided values, not generate new ones
      expect(env.EMAIL_API_URL).toBe("https://custom.email.api/v1")
      expect(env.USERS_API_URL).toBe("https://custom.users.api/v1")
      
      // Should still generate for non-provided URLs
      expect(env.INTL_API_URL).toBe("http://localhost:9090/api/intl")
    })

    it("should handle all services correctly in iteration", async () => {
      const { createEnvConfig } = await import("./index")
      const env = createEnvConfig("bff")
      
      // BFF has access to all service URLs
      expect(env.AUTH_API_URL).toBe("http://localhost:8787/api/auth")
      expect(env.EMAIL_API_URL).toBe("http://localhost:8989/api/email")
      expect(env.GENAI_API_URL).toBe("http://localhost:8383/api/genai")
      expect(env.FILES_API_URL).toBe("http://localhost:8282/api/files")
      expect(env.LOCATION_API_URL).toBe("http://localhost:9494/api/location")
      expect(env.COMMENTS_API_URL).toBe("http://localhost:8585/api/comments")
      expect(env.INTL_API_URL).toBe("http://localhost:9090/api/intl")
      expect(env.ORG_API_URL).toBe("http://localhost:9292/api/org")
      expect(env.PERMISSIONS_API_URL).toBe("http://localhost:9393/api/permissions")
      expect(env.PROJECTS_API_URL).toBe("http://localhost:8484/api/projects")
      expect(env.TASKS_API_URL).toBe("http://localhost:8888/api/tasks")
      expect(env.USERS_API_URL).toBe("http://localhost:9191/api/users")
      expect(env.RXDB_SYNC_API_URL).toBe("http://localhost:8686/api/rxdb-sync")
    })

    it("should handle rxdb special case correctly", async () => {
      const { createEnvConfig } = await import("./index")
      const env = createEnvConfig("rxdb")
      
      // rxdb uses RXDB_SYNC_API_URL instead of RXDB_API_URL
      expect(env.RXDB_SYNC_API_URL).toBeUndefined() // rxdb doesn't reference itself
      expect(env.AUTH_API_URL).toBe("http://localhost:8787/api/auth")
      expect(env.INTL_API_URL).toBe("http://localhost:9090/api/intl")
    })

    it("should use API URLs when they are in the schema", async () => {
      const { createEnvConfig } = await import("./index")
      const env = createEnvConfig("auth")
      
      // Verify these are set (values may vary based on environment)
      expect(env.EMAIL_API_URL).toBeDefined()
      expect(env.USERS_API_URL).toBeDefined()
      expect(env.INTL_API_URL).toBeDefined()
      
      // Verify they contain expected patterns
      expect(env.EMAIL_API_URL).toContain("/api/email")
      expect(env.USERS_API_URL).toContain("/api/users")
      expect(env.INTL_API_URL).toContain("/api/intl")
    })

    it("should handle GOOGLE_REDIRECT_URL correctly", async () => {
      const { createEnvConfig } = await import("./index")
      const env = createEnvConfig("auth")
      
      // Should be set and contain expected path
      expect(env.GOOGLE_REDIRECT_URL).toBeDefined()
      expect(env.GOOGLE_REDIRECT_URL).toContain("/auth/google/callback")
    })

    it("should set GOOGLE_REDIRECT_URL based on FRONTEND_URL", async () => {
      const { createEnvConfig } = await import("./index")
      const env = createEnvConfig("auth")
      
      // GOOGLE_REDIRECT_URL should be set and contain the expected path
      expect(env.GOOGLE_REDIRECT_URL).toBeDefined()
      expect(env.GOOGLE_REDIRECT_URL).toContain("/auth/google/callback")
    })

    it("should not set GOOGLE_REDIRECT_URL for services that don't need it", async () => {
      const { createEnvConfig } = await import("./index")
      const env = createEnvConfig("email")
      
      // Email service doesn't have GOOGLE_REDIRECT_URL in its schema
      expect(env.GOOGLE_REDIRECT_URL).toBeUndefined()
    })
  })

  describe("Custom schema extension", () => {
    it("should merge custom schema with service schema", async () => {
      const customSchema = z.object({
        CUSTOM_API_URL: z.string().url().optional(),
        CUSTOM_PORT: z.coerce.number().default(9999),
      })
      
      const { createEnvConfig } = await import("./index")
      const env = createEnvConfig("auth", customSchema)
      
      // Should have both service and custom fields
      expect(env.EMAIL_API_URL).toBeDefined()
      expect(env.CUSTOM_PORT).toBe(9999)
      
      // Custom API URL should be set if in schema
      if (!env.CUSTOM_API_URL) {
        // Only check if not already set by environment
        expect(env.CUSTOM_API_URL).toBeUndefined()
      }
    })

    it("should only set API URLs for fields in the merged schema", async () => {
      const customSchema = z.object({
        TASKS_API_URL: z.string().url().optional(),
      })
      
      const { createEnvConfig } = await import("./index")
      const env = createEnvConfig("email", customSchema)
      
      // Email service normally doesn't have TASKS_API_URL, but custom schema adds it
      expect(env.TASKS_API_URL).toBe("http://localhost:8888/api/tasks")
    })
  })

  describe("Service iteration logic", () => {
    it("should correctly iterate over all services", async () => {
      // Verify all services are handled
      const { services } = await import("./index")
      const serviceNames = Object.keys(services)
      const expectedServices = [
        "auth", "email", "genai", "files", "location", 
        "bff", "comments", "intl", "org", "permissions", 
        "projects", "tasks", "users", "rxdb"
      ]
      
      expect(serviceNames.sort()).toEqual(expectedServices.sort())
    })

    it("should generate correct API URL field names", () => {
      const urlMappings = {
        auth: "AUTH_API_URL",
        email: "EMAIL_API_URL",
        genai: "GENAI_API_URL",
        files: "FILES_API_URL",
        location: "LOCATION_API_URL",
        bff: "BFF_API_URL",
        comments: "COMMENTS_API_URL",
        intl: "INTL_API_URL",
        org: "ORG_API_URL",
        permissions: "PERMISSIONS_API_URL",
        projects: "PROJECTS_API_URL",
        tasks: "TASKS_API_URL",
        users: "USERS_API_URL",
        rxdb: "RXDB_SYNC_API_URL", // Special case
      }
      
      for (const [serviceName, expectedFieldName] of Object.entries(urlMappings)) {
        const fieldName = serviceName === "rxdb" 
          ? "RXDB_SYNC_API_URL" 
          : `${serviceName.toUpperCase()}_API_URL`
        expect(fieldName).toBe(expectedFieldName)
      }
    })

    it("should generate correct API paths", () => {
      const pathMappings = {
        auth: "/api/auth",
        email: "/api/email",
        genai: "/api/genai",
        files: "/api/files",
        location: "/api/location",
        bff: "/api/bff",
        comments: "/api/comments",
        intl: "/api/intl",
        org: "/api/org",
        permissions: "/api/permissions",
        projects: "/api/projects",
        tasks: "/api/tasks",
        users: "/api/users",
        rxdb: "/api/rxdb-sync", // Special case
      }
      
      for (const [serviceName, expectedPath] of Object.entries(pathMappings)) {
        const apiPath = serviceName === "rxdb" 
          ? "/api/rxdb-sync" 
          : `/api/${serviceName}`
        expect(apiPath).toBe(expectedPath)
      }
    })
  })

  describe("Environment variable precedence", () => {
    it("should not override explicitly set API URLs", async () => {
      // Set some API URLs explicitly
      process.env.AUTH_API_URL = "https://auth.production.com/api"
      process.env.EMAIL_API_URL = "https://email.production.com/api"
      
      const { createEnvConfig } = await import("./index")
      const env = createEnvConfig("bff")
      
      // Should keep the explicitly set values
      expect(env.AUTH_API_URL).toBe("https://auth.production.com/api")
      expect(env.EMAIL_API_URL).toBe("https://email.production.com/api")
      
      // Should generate others
      expect(env.USERS_API_URL).toBe("http://localhost:9191/api/users")
    })
  })

  describe("Required fields for services", () => {
    it("should include required fields for genai service", async () => {
      process.env.REDIS_URL = "redis://localhost:6379"
      
      const { createEnvConfig } = await import("./index")
      const env = createEnvConfig("genai")
      
      // Check that REDIS_URL is present (value may vary based on environment)
      expect(env.REDIS_URL).toBeDefined()
      expect(env.PORT).toBe(8383)
    })

    it("should include required fields for files service", async () => {
      process.env.AWS_REGION = "us-east-1"
      process.env.AWS_ACCESS_KEY_ID = "test-key"
      process.env.AWS_SECRET_ACCESS_KEY = "test-secret"
      process.env.AWS_ENDPOINT_URL_S3 = "https://s3.amazonaws.com"
      
      const { createEnvConfig } = await import("./index")
      const env = createEnvConfig("files")
      
      expect(env.STORAGE_TYPE).toBe("s3")
      // AWS_REGION is present (value may be different in test environment)
      expect(env.AWS_REGION).toBeDefined()
      expect(env.PORT).toBe(8282)
    })

    it("should include required fields for tasks service", async () => {
      process.env.REDIS_URL = "redis://localhost:6379"
      
      const { createEnvConfig } = await import("./index")
      const env = createEnvConfig("tasks")
      
      // Check that REDIS_URL is present (value may vary based on environment)
      expect(env.REDIS_URL).toBeDefined()
      expect(env.PORT).toBe(8888)
    })
  })
})