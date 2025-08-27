import { createEnvConfig } from "@incmix-api/utils/env-config"
import { config } from "dotenv"
import path from "path"

console.log("Current working directory:", process.cwd())
console.log("NODE_ENV:", process.env.NODE_ENV)

// Try manually loading the root .env file first
const rootPath = path.resolve(process.cwd(), "../..")
console.log("Root path:", rootPath)
console.log("Looking for .env at:", path.join(rootPath, ".env"))

// Load root .env manually
const result = config({ path: path.join(rootPath, ".env") })
if (result.error) {
  console.error("Error loading root .env:", result.error)
} else {
  console.log("Successfully loaded root .env")
  console.log("DATABASE_URL from root:", process.env.DATABASE_URL ? "✓ Set" : "✗ Missing")
}

console.log("Attempting to load env config for auth service...")

try {
  const envVars = createEnvConfig("auth")
  console.log("Successfully loaded env config:")
  console.log("- DATABASE_URL:", envVars.DATABASE_URL ? "✓ Set" : "✗ Missing")
  console.log("- SENTRY_DSN:", envVars.SENTRY_DSN ? "✓ Set" : "✗ Missing")
  console.log("- FRONTEND_URL:", envVars.FRONTEND_URL ? "✓ Set" : "✗ Missing")
} catch (error) {
  console.error("Failed to load env config:", error.message)
}