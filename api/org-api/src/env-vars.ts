import { createEnvConfig, type OrgEnv } from "@incmix-api/utils/env-config"

export { Services } from "@incmix-api/utils/env-config"
// Use the new env-config system with dotenv-mono
// This will automatically merge:
// 1. Root .env file
// 2. Root .env.{NODE_ENV} file
// 3. Service-specific .env file (if exists)
// 4. Service-specific .env.{NODE_ENV} file (if exists)
export const envVars = createEnvConfig("org") as OrgEnv
export type Env = OrgEnv
