import { createEnvConfig } from "@incmix-api/utils/env-config"

// Ensure NODE_ENV is set to test before loading environment
process.env.NODE_ENV = "test"

// Load environment variables for tests
export const testEnvVars = createEnvConfig("auth")

// Export the environment variables for use in tests
export { testEnvVars as envVars }
