import { createEnvConfig } from "@incmix-api/utils/env-config"
import { z } from "zod"

// Task-specific environment variables
const taskSpecificSchema = z.object({
  COOKIE_NAME: z.string().default("incmix_session"),
  INTL_API_URL: z.string().url(),
  AUTH_API_URL: z.string().url(),
  ORG_API_URL: z.string().url(),
  DOMAIN: z.string().default("localhost"),
  REDIS_PASSWORD: z.string().optional(),
})

export const envVars = createEnvConfig(undefined, taskSpecificSchema)

export type ENV = typeof envVars
