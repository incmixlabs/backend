import { createEnvConfig } from "@incmix-api/utils/env-config"

// Use the new env-config system with dotenv-mono
export const envVars = createEnvConfig("email")
