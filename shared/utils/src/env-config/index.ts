import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { config as dotenvConfig } from "dotenv"
import { createValidator } from "../ajv-schema/index"

// Default ports for each service
export const services = {
  auth: {
    port: 8787,
    dir: "auth",
  },
  email: {
    port: 8989,
    dir: "email",
  },
  genai: {
    port: 8383,
    dir: "genai-api",
  },
  files: {
    port: 8282,
    dir: "files-api",
  },
  location: {
    port: 9494,
    dir: "location-api",
  },
  bff: {
    port: 8080,
    dir: "bff-web",
  },
  comments: {
    port: 8585,
    dir: "comments-api",
  },
  intl: {
    port: 9090,
    dir: "intl-api",
  },
  org: {
    port: 9292,
    dir: "org-api",
  },

  projects: {
    port: 8484,
    dir: "projects-api",
  },
  rxdb: {
    port: 8686,
    dir: "rxdb-api",
    endpoint: "rxdb-sync",
  },
}

// Helper function to build API URLs with DOMAIN
function buildApiUrl(port: number, path: string, domain?: string): string {
  const baseDomain = domain || "http://localhost"
  // If domain doesn't include protocol, add http://
  const fullDomain = baseDomain.includes("://")
    ? baseDomain
    : `http://${baseDomain}`
  return `${fullDomain}:${port}${path}`
}

// Base environment interface
interface BaseEnv {
  NODE_ENV: "development" | "production" | "test"
  DATABASE_URL: string
  SENTRY_DSN?: string
  FRONTEND_URL: string
  DOMAIN: string
  COOKIE_NAME: string
  MOCK_DATA: boolean
  INTL_API_URL?: string
  TIMEOUT_MS: number
  AUTH_API_URL?: string
  REDIS_URL: string
}

// Base environment schema shared across all services
const baseEnvSchema = {
  type: "object",
  properties: {
    NODE_ENV: {
      type: "string",
      enum: ["development", "production", "test"],
      default: "development",
    },
    DATABASE_URL: { type: "string", format: "uri" },
    SENTRY_DSN: { type: "string", format: "uri" },
    FRONTEND_URL: { type: "string", format: "uri" },
    DOMAIN: { type: "string", default: "http://localhost" },
    COOKIE_NAME: { type: "string", default: "incmix_session" },
    MOCK_DATA: { type: "boolean", default: false },
    INTL_API_URL: { type: "string", format: "uri" },
    TIMEOUT_MS: { type: "number", default: 5000 },
    AUTH_API_URL: { type: "string", format: "uri" },
    REDIS_URL: { type: "string", format: "uri" },
  },
  required: [
    "DATABASE_URL",
    "FRONTEND_URL",
    "REDIS_URL",
  ],
  additionalProperties: true,
}

// Service-specific interfaces
interface AuthEnv extends BaseEnv {
  GOOGLE_REDIRECT_URL?: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  PORT: number
  EMAIL_API_URL?: string
  FILES_API_URL?: string
}

interface EmailEnv extends BaseEnv {
  EMAIL_FROM: string
  RESEND_API_KEY: string
  RESEND_WEBHOOK_SECRET?: string
  PORT: number
}

interface GenAIEnv extends BaseEnv {
  FIGMA_ACCESS_TOKEN?: string
  FIGMA_TOKEN?: string
  ANTHROPIC_API_KEY?: string
  GOOGLE_AI_API_KEY?: string
  PORT: number
  ORG_API_URL?: string
}

interface FilesEnv extends BaseEnv {
  STORAGE_TYPE: "local" | "s3"
  UPLOAD_DIR?: string
  AWS_REGION: string
  AWS_ACCESS_KEY_ID: string
  AWS_SECRET_ACCESS_KEY: string
  BUCKET_NAME?: string
  AWS_ENDPOINT_URL_S3: string
  PORT: number
}

interface LocationEnv extends BaseEnv {
  LOCATION_API_KEY: string
  LOCATION_URL: string
  WEATHER_API_KEY: string
  WEATHER_URL: string
  SERP_API_KEY: string
  SERP_NEWS_URL: string
  PORT: number
}

interface BffEnv extends Omit<BaseEnv, "DATABASE_URL" | "SENTRY_DSN"> {
  PORT: number
  ORG_API_URL?: string
  GENAI_API_URL?: string
  PROJECTS_API_URL?: string
  COMMENTS_API_URL?: string
  FILES_API_URL?: string
  EMAIL_API_URL?: string
  LOCATION_API_URL?: string
  RXDB_API_URL?: string
  DATABASE_URL?: string
  SENTRY_DSN?: string
}

interface CommentsEnv extends BaseEnv {
  PORT: number
  ORG_API_URL?: string
}

interface IntlEnv extends BaseEnv {
  PORT: number
  AUTH_API_URL?: string
}

interface OrgEnv extends BaseEnv {
  PORT: number
}

interface ProjectsEnv extends BaseEnv {
  PORT: number
  ORG_API_URL?: string
  FILES_API_URL?: string
}

interface RxdbEnv extends BaseEnv {
  PORT: number
}

// Service-specific schema extensions
const serviceSchemas: Record<string, any> = {
  auth: {
    ...baseEnvSchema,
    properties: {
      ...baseEnvSchema.properties,
      GOOGLE_REDIRECT_URL: { type: "string", format: "uri", nullable: true },
      GOOGLE_CLIENT_ID: { type: "string" },
      GOOGLE_CLIENT_SECRET: { type: "string" },
      PORT: { type: "number", default: services.auth.port },
      EMAIL_API_URL: { type: "string", format: "uri", nullable: true },
      FILES_API_URL: { type: "string", format: "uri", nullable: true },
    },
    required: [
      ...baseEnvSchema.required,
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "PORT",
    ],
  },
  email: {
    ...baseEnvSchema,
    properties: {
      ...baseEnvSchema.properties,
      EMAIL_FROM: { type: "string", format: "email" },
      RESEND_API_KEY: { type: "string" },
      RESEND_WEBHOOK_SECRET: { type: "string", nullable: true },
      PORT: { type: "number", default: services.email.port },
    },
    required: [
      ...baseEnvSchema.required,
      "EMAIL_FROM",
      "RESEND_API_KEY",
      "PORT",
    ],
  },
  genai: {
    ...baseEnvSchema,
    properties: {
      ...baseEnvSchema.properties,
      FIGMA_ACCESS_TOKEN: { type: "string", nullable: true },
      FIGMA_TOKEN: { type: "string", nullable: true },
      ANTHROPIC_API_KEY: { type: "string", nullable: true },
      GOOGLE_AI_API_KEY: { type: "string", nullable: true },
      PORT: { type: "number", default: services.genai.port },
      REDIS_URL: { type: "string", format: "uri", nullable: true },
      ORG_API_URL: { type: "string", format: "uri", nullable: true },
    },
    required: [...baseEnvSchema.required, "PORT"],
  },
  files: {
    ...baseEnvSchema,
    properties: {
      ...baseEnvSchema.properties,
      STORAGE_TYPE: { type: "string", enum: ["local", "s3"], default: "s3" },
      UPLOAD_DIR: { type: "string", nullable: true },
      AWS_REGION: { type: "string" },
      AWS_ACCESS_KEY_ID: { type: "string" },
      AWS_SECRET_ACCESS_KEY: { type: "string" },
      BUCKET_NAME: { type: "string", nullable: true },
      AWS_ENDPOINT_URL_S3: { type: "string" },
      PORT: { type: "number", default: services.files.port },
    },
    required: [
      ...baseEnvSchema.required,
      "STORAGE_TYPE",
      "AWS_REGION",
      "AWS_ACCESS_KEY_ID",
      "AWS_SECRET_ACCESS_KEY",
      "AWS_ENDPOINT_URL_S3",
      "PORT",
    ],
  },
  location: {
    ...baseEnvSchema,
    properties: {
      ...baseEnvSchema.properties,
      LOCATION_API_KEY: { type: "string" },
      LOCATION_URL: { type: "string" },
      WEATHER_API_KEY: { type: "string" },
      WEATHER_URL: { type: "string" },
      SERP_API_KEY: { type: "string" },
      SERP_NEWS_URL: { type: "string" },
      REDIS_URL: { type: "string", format: "uri", nullable: true },
      PORT: { type: "number", default: services.location.port },
    },
    required: [
      ...baseEnvSchema.required,
      "LOCATION_API_KEY",
      "LOCATION_URL",
      "WEATHER_API_KEY",
      "WEATHER_URL",
      "SERP_API_KEY",
      "SERP_NEWS_URL",
      "PORT",
    ],
  },
  bff: {
    type: "object",
    properties: {
      NODE_ENV: baseEnvSchema.properties.NODE_ENV,
      FRONTEND_URL: baseEnvSchema.properties.FRONTEND_URL,
      DOMAIN: baseEnvSchema.properties.DOMAIN,
      COOKIE_NAME: baseEnvSchema.properties.COOKIE_NAME,
      MOCK_DATA: baseEnvSchema.properties.MOCK_DATA,
      INTL_API_URL: baseEnvSchema.properties.INTL_API_URL,
      TIMEOUT_MS: baseEnvSchema.properties.TIMEOUT_MS,
      AUTH_API_URL: baseEnvSchema.properties.AUTH_API_URL,
      REDIS_URL: baseEnvSchema.properties.REDIS_URL,
      DATABASE_URL: { type: "string", format: "uri", nullable: true },
      SENTRY_DSN: { type: "string", format: "uri", nullable: true },
      PORT: { type: "number", default: services.bff.port },
      ORG_API_URL: { type: "string", format: "uri", nullable: true },
      GENAI_API_URL: { type: "string", format: "uri", nullable: true },
      PROJECTS_API_URL: { type: "string", format: "uri", nullable: true },
      COMMENTS_API_URL: { type: "string", format: "uri", nullable: true },
      FILES_API_URL: { type: "string", format: "uri", nullable: true },
      EMAIL_API_URL: { type: "string", format: "uri", nullable: true },
      LOCATION_API_URL: { type: "string", format: "uri", nullable: true },
      RXDB_API_URL: { type: "string", format: "uri", nullable: true },
    },
    required: [
      "NODE_ENV",
      "FRONTEND_URL",
      "DOMAIN",
      "COOKIE_NAME",
      "MOCK_DATA",
      "TIMEOUT_MS",
      "REDIS_URL",
      "PORT",
    ],
    additionalProperties: true,
  },
  comments: {
    ...baseEnvSchema,
    properties: {
      ...baseEnvSchema.properties,
      PORT: { type: "number", default: services.comments.port },
      ORG_API_URL: { type: "string", format: "uri", nullable: true },
    },
    required: [...baseEnvSchema.required, "PORT"],
  },
  intl: {
    ...baseEnvSchema,
    properties: {
      ...baseEnvSchema.properties,
      PORT: { type: "number", default: services.intl.port },
      AUTH_API_URL: { type: "string", format: "uri", nullable: true },
    },
    required: [...baseEnvSchema.required, "PORT"],
  },
  org: {
    ...baseEnvSchema,
    properties: {
      ...baseEnvSchema.properties,
      PORT: { type: "number", default: services.org.port },
    },
    required: [...baseEnvSchema.required, "PORT"],
  },
  projects: {
    ...baseEnvSchema,
    properties: {
      ...baseEnvSchema.properties,
      PORT: { type: "number", default: services.projects.port },
      ORG_API_URL: { type: "string", format: "uri", nullable: true },
      REDIS_URL: { type: "string", format: "uri", nullable: true },
      FILES_API_URL: { type: "string", format: "uri", nullable: true },
    },
    required: [...baseEnvSchema.required, "PORT"],
  },
  rxdb: {
    ...baseEnvSchema,
    properties: {
      ...baseEnvSchema.properties,
      PORT: { type: "number", default: services.rxdb.port },
    },
    required: [...baseEnvSchema.required, "PORT"],
  },
}

export type ServiceName = keyof typeof serviceSchemas
export function createEnvConfig<T extends ServiceName>(
  serviceName?: T,
  customSchema?: any,
  envOverride?: "test" | "development" | "production"
) {
  // Load environment variables using dotenv-mono
  // This will merge root .env with service-specific .env and NODE_ENV specific files
  const nodeEnv = envOverride || process.env.NODE_ENV || "development"

  // Get the directory of the current module
  const __dirname = path.dirname(fileURLToPath(import.meta.url))

  // Find the backend root directory
  // When compiled: dist/src/env-config -> needs 5 levels up
  // When source: src/env-config -> needs 4 levels up
  // Check if we're running from dist or src
  const parts = path.normalize(__dirname).split(path.sep)
  const isCompiled = parts.includes("dist")
  const levelsUp = isCompiled
    ? path.join("..", "..", "..", "..", "..")
    : path.join("..", "..", "..", "..")
  const backendRoot = path.resolve(__dirname, levelsUp)
  // Get the monorepo root (parent of backend)
  const monorepoRoot = path.resolve(backendRoot, "..")

  // Load environment variables in order of priority (lowest to highest)
  // This ensures that higher priority files override lower priority ones

  const envFiles: Array<{ path: string; priority: number }> = []

  // Base priority: monorepo root .env files (lowest priority)
  const monorepoEnv = path.join(monorepoRoot, ".env")
  const monorepoEnvWithMode = path.join(monorepoRoot, `.env.${nodeEnv}`)
  if (existsSync(monorepoEnv)) {
    envFiles.push({ path: monorepoEnv, priority: 5 })
  }
  if (existsSync(monorepoEnvWithMode)) {
    envFiles.push({ path: monorepoEnvWithMode, priority: 15 })
  }

  // Backend root .env files (medium priority)
  const backendEnv = path.join(backendRoot, ".env")
  const backendEnvWithMode = path.join(backendRoot, `.env.${nodeEnv}`)
  if (existsSync(backendEnv)) {
    envFiles.push({ path: backendEnv, priority: 10 })
  }
  if (existsSync(backendEnvWithMode)) {
    envFiles.push({ path: backendEnvWithMode, priority: 20 })
  }

  // Service-specific env files get higher priority
  if (serviceName) {
    const dir = (services as any)[serviceName].dir
    const serviceDir = path.join(backendRoot, "api", `${dir}`)
    const serviceEnv = path.join(serviceDir, ".env")
    const serviceEnvWithMode = path.join(serviceDir, `.env.${nodeEnv}`)
    if (existsSync(serviceEnv)) {
      envFiles.push({ path: serviceEnv, priority: 30 })
    }
    if (existsSync(serviceEnvWithMode)) {
      envFiles.push({ path: serviceEnvWithMode, priority: 40 })
    }
  }

  // Sort by priority (ascending) and load each file
  envFiles.sort((a, b) => a.priority - b.priority)

  if (process.env.DEBUG_ENV_LOADING) {
    console.log("[DEBUG] Loading env files:")
    console.log("  Backend root:", backendRoot)
    console.log(
      "  Files to load:",
      envFiles.map((f) => f.path)
    )
  }

  // Load each file without override to preserve explicitly set values
  for (const file of envFiles) {
    dotenvConfig({ path: file.path, override: false })
  }

  if (process.env.DEBUG_ENV_LOADING) {
    console.log("[DEBUG] After loading all files:")
    console.log("  DATABASE_URL:", process.env.DATABASE_URL ? "✓" : "✗")
    console.log("  SENTRY_DSN:", process.env.SENTRY_DSN ? "✓" : "✗")
    console.log(
      "  GOOGLE_REDIRECT_URL:",
      process.env.GOOGLE_REDIRECT_URL ? "✓" : "✗"
    )
  }
  // Start with base schema
  let schema: any = baseEnvSchema

  // Add service-specific schema if provided
  if (serviceName && serviceSchemas[serviceName as string]) {
    schema = serviceSchemas[serviceName as string]
  }

  // Add custom schema if provided
  if (customSchema) {
    schema = {
      ...schema,
      properties: {
        ...schema.properties,
        ...customSchema.properties,
      },
      required: [...(schema.required || []), ...(customSchema.required || [])],
    }
  }

  process.env.NODE_ENV = nodeEnv
  // Parse and validate environment variables
  const validator = createValidator(schema)
  const result = validator.safeParse(process.env)

  if (!result.success) {
    console.error("Environment validation failed:", result.errors)
    throw new Error("Environment validation failed")
  }
  // Post-process to apply DOMAIN to API URLs if they use default values
  const env = result.data
  const domain = String(env.DOMAIN || "http://localhost")

  // Apply domain to API URLs only if they are defined in the schema
  // Only set defaults if the environment variable is not already provided
  const schemaProperties = schema.properties || {}

  // Helper to check if a field exists in the schema and set its value
  const setApiUrlIfInSchema = (
    fieldName: string,
    port: number,
    path: string
  ) => {
    if (fieldName in schemaProperties && !env[fieldName]) {
      env[fieldName] = buildApiUrl(port, path, domain)
    }
  }

  // Iterate over services to set API URLs if they're in the schema
  for (const [serviceName, serviceConfig] of Object.entries(services) as [ServiceName, any][]) {
    // Convert service name to API URL field name (e.g., "auth" -> "AUTH_API_URL")
    const endpoint = (serviceConfig as any)?.endpoint || serviceName
    const apiUrlFieldName = `${serviceName.toUpperCase()}_API_URL`
    const fieldName = apiUrlFieldName.replaceAll("-", "_")
    const apiPath = `/api/${endpoint}`

    setApiUrlIfInSchema(fieldName, serviceConfig.port, apiPath)
  }

  // Special case for GOOGLE_REDIRECT_URL - only set if in schema
  if ("GOOGLE_REDIRECT_URL" in schemaProperties && !env.GOOGLE_REDIRECT_URL) {
    env.GOOGLE_REDIRECT_URL = `${env.FRONTEND_URL}/auth/google/callback`
  }
  return env
}

export type { BaseEnv, AuthEnv, EmailEnv, GenAIEnv, FilesEnv, LocationEnv, BffEnv, CommentsEnv, IntlEnv, OrgEnv, ProjectsEnv, RxdbEnv }
export const envVars = createEnvConfig() as BaseEnv
