import { z } from "zod"

// Base environment schema shared across all services
const baseEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  FRONTEND_URL: z.string().url().optional(),
  API_URL: z.string().url().optional(),
})

// Service-specific schema extensions
const serviceSchemas = {
  auth: z.object({
    JWT_SECRET: z.string(),
    JWT_EXPIRES_IN: z.string().default("7d"),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
  }),
  email: z.object({
    EMAIL_FROM: z.string().email(),
    RESEND_API_KEY: z.string(),
    RESEND_WEBHOOK_SECRET: z.string().optional(),
  }),
  genai: z.object({
    OPENAI_API_KEY: z.string(),
    OPENAI_MODEL: z.string().default("gpt-4"),
    FIGMA_ACCESS_TOKEN: z.string().optional(),
  }),
  files: z.object({
    STORAGE_TYPE: z.enum(["local", "s3"]).default("local"),
    UPLOAD_DIR: z.string().optional(),
    AWS_REGION: z.string().optional(),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    S3_BUCKET: z.string().optional(),
  }),
  location: z.object({
    OPENWEATHER_API_KEY: z.string().optional(),
    NEWS_API_KEY: z.string().optional(),
  }),
}

export type ServiceName = keyof typeof serviceSchemas

export function createEnvConfig<T extends ServiceName>(
  serviceName?: T,
  customSchema?: z.ZodObject<any>
) {
  let schema: z.ZodObject<any> = baseEnvSchema as z.ZodObject<any>

  // Add service-specific schema if provided
  if (serviceName && serviceSchemas[serviceName]) {
    schema = baseEnvSchema.merge(
      serviceSchemas[serviceName]
    ) as z.ZodObject<any>
  }

  // Add custom schema if provided
  if (customSchema) {
    schema = schema.merge(customSchema) as z.ZodObject<any>
  }

  // Parse and validate environment variables
  const result = schema.safeParse(process.env)

  if (!result.success) {
    console.error("Environment validation failed:")
    console.error(result.error.flatten())
    process.exit(1)
  }

  return result.data
}

export type BaseEnv = z.infer<typeof baseEnvSchema>
export type AuthEnv = BaseEnv & z.infer<typeof serviceSchemas.auth>
export type EmailEnv = BaseEnv & z.infer<typeof serviceSchemas.email>
export type GenAIEnv = BaseEnv & z.infer<typeof serviceSchemas.genai>
export type FilesEnv = BaseEnv & z.infer<typeof serviceSchemas.files>
export type LocationEnv = BaseEnv & z.infer<typeof serviceSchemas.location>
