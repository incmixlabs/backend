import path from "node:path"
import { fileURLToPath } from "node:url"
import { load } from "dotenv-mono"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
console.log("Current __dirname:", __dirname)

// Test the exact logic from createEnvConfig
const backendRoot = path.resolve(__dirname, "../..")
console.log("Backend root:", backendRoot)

const nodeEnv = "test"
const _serviceName = "auth"
const dir = "auth"

// Set up priorities (same as in createEnvConfig)
const priorities = {}
priorities[path.join(backendRoot, ".env")] = 10
priorities[path.join(backendRoot, `.env.${nodeEnv}`)] = 20

const serviceDir = path.join(backendRoot, "api", dir)
priorities[path.join(serviceDir, ".env")] = 30
priorities[path.join(serviceDir, `.env.${nodeEnv}`)] = 40

console.log("\nPriorities:")
Object.entries(priorities).forEach(([file, priority]) => {
  console.log(`  ${priority}: ${file}`)
})

console.log("\nAttempting to load with dotenv-mono...")
try {
  load({
    path: backendRoot,
    priorities,
    expand: true,
    override: true,
  })
  console.log("dotenv-mono load succeeded")
  console.log("\nLoaded env vars:")
  console.log("- DATABASE_URL:", process.env.DATABASE_URL ? "✓" : "✗")
  console.log("- SENTRY_DSN:", process.env.SENTRY_DSN ? "✓" : "✗")
  console.log("- FRONTEND_URL:", process.env.FRONTEND_URL ? "✓" : "✗")
  console.log(
    "- GOOGLE_REDIRECT_URL:",
    process.env.GOOGLE_REDIRECT_URL ? "✓" : "✗"
  )
  console.log("- GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "✓" : "✗")
  console.log(
    "- GOOGLE_CLIENT_SECRET:",
    process.env.GOOGLE_CLIENT_SECRET ? "✓" : "✗"
  )
} catch (error) {
  console.error("dotenv-mono load failed:", error)
}
