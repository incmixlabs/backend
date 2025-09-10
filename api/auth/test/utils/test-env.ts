import { type AuthEnv, createEnvConfig } from "@incmix-api/utils/env-config"

// Test environment configuration for auth service
// This file is used during testing to provide environment variables
export const envVars = createEnvConfig("auth") as AuthEnv
export type Env = AuthEnv
