import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { config as dotenvConfig } from "dotenv"
import { z } from "zod"
import { c } from "@intlify/utils/dist/shared/utils.77e85720.js"

export const NodeEnvs = {
  dev: "dev",
  qa: "qa",
  uat: "uat",
  prod: "prod",
  test: "test",
} as const
export const Services = {
  auth: "auth",
  email: "email",
  genai: "genai",
  files: "files",
  location: "location",
  bff: "bff",
  comments: "comments",
  intl: "intl",
  org: "org",
  projects: "projects",
  rxdb: "rxdb",
} as const
export type Service = (typeof Services)[keyof typeof Services]
// Default ports for each service
export const services = {
  [Services.auth]: {
    port: 8787,
    dir: "auth",
  },
  [Services.email]: {
    port: 8989,
    dir: "email",
  },
  [Services.genai]: {
    port: 8383,
    dir: "genai-api",
  },
  [Services.files]: {
    port: 8282,
    dir: "files-api",
  },
  [Services.location]: {
    port: 9494,
    dir: "location-api",
  },
  [Services.bff]: {
    port: 8080,
    dir: "bff-web",
  },
  [Services.comments]: {
    port: 8585,
    dir: "comments-api",
  },
  [Services.intl]: {
    port: 9090,
    dir: "intl-api",
  },
  [Services.org]: {
    port: 9292,
    dir: "org-api",
  },
  [Services.projects]: {
    port: 8484,
    dir: "projects-api",
  },
  [Services.rxdb]: {
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

// Base environment schema shared across all services
const baseEnvSchema = z.object({
  NODE_ENV: z.enum(["dev", "qa", "uat", "prod", "test"]).default("test"),
  DATABASE_URL: z.string().url(),
  SENTRY_DSN: z.string().url().optional(),
  FRONTEND_URL: z.string().url(),
  DOMAIN: z.string().default("http://localhost"),
  COOKIE_NAME: z.string().default("incmix_session"),
  MOCK_DATA: z.coerce.boolean().default(false),
  INTL_API_URL: z.string().url().optional(),
  TIMEOUT_MS: z.coerce.number().default(5000),
  AUTH_API_URL: z.string().url().optional(),
  REDIS_URL: z.string().url(),
})

// Service-specific schema extensions
const serviceSchemas = {
  auth: baseEnvSchema.extend({
    GOOGLE_REDIRECT_URL: z.string().url().optional(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    PORT: z.coerce.number().default(services.auth.port),
    // API URLs
    EMAIL_API_URL: z.string().url().optional(),
    FILES_API_URL: z.string().url().optional(),
  }),
  email: baseEnvSchema.extend({
    EMAIL_FROM: z.string().email(),
    RESEND_API_KEY: z.string(),
    RESEND_WEBHOOK_SECRET: z.string().optional(),
    PORT: z.coerce.number().default(services.email.port),
  }),
  genai: baseEnvSchema.extend({
    FIGMA_ACCESS_TOKEN: z.string().optional(),
    FIGMA_TOKEN: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    GOOGLE_AI_API_KEY: z.string().optional(),
    PORT: z.coerce.number().default(services.genai.port),
    REDIS_URL: z.string().url().optional(),
    ORG_API_URL: z.string().url().optional(),
  }),
  files: baseEnvSchema.extend({
    STORAGE_TYPE: z.enum(["local", "s3"]).default("s3"),
    UPLOAD_DIR: z.string().optional(),
    AWS_REGION: z.string(),
    AWS_ACCESS_KEY_ID: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string(),
    BUCKET_NAME: z.string().optional(),
    AWS_ENDPOINT_URL_S3: z.string(),
    PORT: z.coerce.number().default(services.files.port),
  }),
  location: baseEnvSchema.extend({
    LOCATION_API_KEY: z.string(),
    LOCATION_URL: z.string(),
    WEATHER_API_KEY: z.string(),
    WEATHER_URL: z.string(),
    SERP_API_KEY: z.string(),
    SERP_NEWS_URL: z.string(),
    REDIS_URL: z.string().url().optional(),
    PORT: z.coerce.number().default(services.location.port),
  }),
  bff: baseEnvSchema.omit({ DATABASE_URL: true, SENTRY_DSN: true }).extend({
    PORT: z.coerce.number().default(services.bff.port),
    ORG_API_URL: z.string().url().optional(),
    GENAI_API_URL: z.string().url().optional(),
    PROJECTS_API_URL: z.string().url().optional(),
    COMMENTS_API_URL: z.string().url().optional(),
    FILES_API_URL: z.string().url().optional(),
    EMAIL_API_URL: z.string().url().optional(),
    LOCATION_API_URL: z.string().url().optional(),
    RXDB_API_URL: z.string().url().optional(),
  }),
  comments: baseEnvSchema.extend({
    PORT: z.coerce.number().default(services.comments.port),
    ORG_API_URL: z.string().url().optional(),
  }),
  intl: baseEnvSchema.extend({
    PORT: z.coerce.number().default(services.intl.port),
    AUTH_API_URL: z.string().url().optional(),
  }),
  org: baseEnvSchema.extend({
    PORT: z.coerce.number().default(services.org.port),
  }),

  projects: baseEnvSchema.extend({
    PORT: z.coerce.number().default(services.projects.port),
    ORG_API_URL: z.string().url().optional(),
    REDIS_URL: z.string().url().optional(),
    FILES_API_URL: z.string().url().optional(),
  }),
  rxdb: baseEnvSchema.extend({
    PORT: z.coerce.number().default(services.rxdb.port),
  }),
}

export type ServiceName = keyof typeof serviceSchemas
export function createEnvConfig<T extends ServiceName>(
  serviceName?: T,
  customSchema?: z.ZodObject<any>,
  envOverride?: "dev" | "qa" | "uat" | "prod" | "test"
) {
  // Load environment variables using dotenv-mono
  // This will merge root .env with service-specific .env and NODE_ENV specific files
  const nodeEnv = envOverride || process.env.NODE_ENV || "test"

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
    const dir = services[serviceName].dir
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

  // Start with base schema
  let schema: z.ZodObject<any> = baseEnvSchema as z.ZodObject<any>

  // Add service-specific schema if provided
  if (serviceName && serviceSchemas[serviceName]) {
    schema = baseEnvSchema.extend(
      serviceSchemas[serviceName].shape
    ) as z.ZodObject<any>
  }

  // Add custom schema if provided
  if (customSchema) {
    schema = schema.extend(customSchema.shape) as z.ZodObject<any>
  }

  process.env.NODE_ENV = nodeEnv
  // Parse and validate environment variables
  const result = schema.safeParse(process.env)
  if (!result.success) {
    console.error("Environment validation failed:", result.error.format())
    throw new Error("Environment validation failed")
  }
  // Post-process to apply DOMAIN to API URLs if they use default values
  const env = result.data
  const domain = String(env.DOMAIN || "http://localhost")

  // Apply domain to API URLs only if they are defined in the schema
  // Only set defaults if the environment variable is not already provided
  const schemaShape = schema.shape

  // Helper to check if a field exists in the schema and set its value
  const setApiUrlIfInSchema = (
    fieldName: string,
    port: number,
    path: string
  ) => {
    if (fieldName in schemaShape && !env[fieldName]) {
      env[fieldName] = buildApiUrl(port, path, domain)
    }
  }

  // Iterate over services to set API URLs if they're in the schema
  for (const [serviceName, serviceConfig] of Object.entries(services)) {
    // Convert service name to API URL field name (e.g., "auth" -> "AUTH_API_URL")
    const endpoint = (serviceConfig as any)?.endpoint || serviceName
    const apiUrlFieldName = `${serviceName.toUpperCase()}_API_URL`
    const fieldName = apiUrlFieldName.replaceAll("-", "_")
    const apiPath = `/api/${endpoint}`

    setApiUrlIfInSchema(fieldName, serviceConfig.port, apiPath)
  }

  // Special case for GOOGLE_REDIRECT_URL - only set if in schema
  if ("GOOGLE_REDIRECT_URL" in schemaShape && !env.GOOGLE_REDIRECT_URL) {
    env.GOOGLE_REDIRECT_URL = `${env.FRONTEND_URL}/auth/google/callback`
  }
  return env
}

export type BaseEnv = z.infer<typeof baseEnvSchema>
export type AuthEnv = BaseEnv & z.infer<typeof serviceSchemas.auth>
export type EmailEnv = BaseEnv & z.infer<typeof serviceSchemas.email>
export type GenAIEnv = BaseEnv & z.infer<typeof serviceSchemas.genai>
export type FilesEnv = BaseEnv & z.infer<typeof serviceSchemas.files>
export type LocationEnv = BaseEnv & z.infer<typeof serviceSchemas.location>
export type BffEnv = BaseEnv & z.infer<typeof serviceSchemas.bff>
export type CommentsEnv = BaseEnv & z.infer<typeof serviceSchemas.comments>
export type IntlEnv = BaseEnv & z.infer<typeof serviceSchemas.intl>
export type OrgEnv = BaseEnv & z.infer<typeof serviceSchemas.org>

export type ProjectsEnv = BaseEnv & z.infer<typeof serviceSchemas.projects>

export type RxdbEnv = BaseEnv & z.infer<typeof serviceSchemas.rxdb>
export const envVars = createEnvConfig() as BaseEnv
