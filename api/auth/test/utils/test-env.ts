import { type AuthEnv, createEnvConfig } from "@incmix-api/utils/env-config"

// Test environment configuration for auth service
// This file is used during testing to provide environment variables

// Force NODE_ENV to be test
process.env.NODE_ENV = "test"

export const envVars = {
  ...createEnvConfig("auth"),
  NODE_ENV: "test" as const,
} as AuthEnv
export type Env = AuthEnv
