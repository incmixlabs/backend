import { getEnvSchema } from "@incmix-api/config"
// Load environment variables from .env file
const { env } = getEnvSchema(Number(process.env.PORT) || 9494)

export const envVars = env
