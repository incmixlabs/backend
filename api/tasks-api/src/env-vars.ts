import { getEnvSchema } from "@incmix-api/config"
// Load environment variables from .env file
const { env } = getEnvSchema(Number(process.env.PORT) || 8888)

export const envVars = env
