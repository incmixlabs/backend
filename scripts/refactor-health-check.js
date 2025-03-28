#!/usr/bin/env node

/**
 * This script helps migrate a service's health check implementation
 * to use the shared utility. Run it from the root directory of a service.
 *
 * Usage: node refactor-health-check.js --service <service-name>
 *
 * Example: node refactor-health-check.js --service auth
 */

const fs = require("node:fs")
const path = require("node:path")

const args = process.argv.slice(2)
const serviceArg = args.findIndex((arg) => arg === "--service")
const serviceName = serviceArg !== -1 ? args[serviceArg + 1] : null

if (!serviceName) {
  console.error("Error: Service name is required. Use --service <service-name>")
  process.exit(1)
}

const serviceDir = path.join(__dirname, "..", "api", serviceName)
const healthCheckDir = path.join(serviceDir, "src", "routes", "health-check")

// Check if the service directory exists
if (!fs.existsSync(serviceDir)) {
  console.error(`Error: Service '${serviceName}' not found in api directory`)
  process.exit(1)
}

// Check if the health-check directory exists
if (!fs.existsSync(healthCheckDir)) {
  console.error(
    `Error: Health check directory not found in ${serviceName} service`
  )
  process.exit(1)
}

// Identify the database variable if it exists
let dbVar = null
const dbPath = path.join(serviceDir, "src", "lib", "db.ts")
if (fs.existsSync(dbPath)) {
  const dbContent = fs.readFileSync(dbPath, "utf8")
  const dbExportMatch = dbContent.match(/export\s+const\s+(\w+)\s*=/)
  if (dbExportMatch) {
    dbVar = dbExportMatch[1]
  }
}

// Read env-vars.ts to get available environment variables
const envVarsPath = path.join(serviceDir, "src", "env-vars.ts")
const envVarsContent = fs.readFileSync(envVarsPath, "utf8")

// Extract environment variables from schema
const envVarsMatch = envVarsContent.match(/z\.object\(\{([^}]+)\}\)/s)
if (!envVarsMatch) {
  console.error(
    "Error: Could not extract environment variables from env-vars.ts"
  )
  process.exit(1)
}

const envVarsSchemaContent = envVarsMatch[1]
const envVars = envVarsSchemaContent
  .split("\n")
  .map((line) => {
    const match = line.match(/\s*(\w+):/)
    return match ? match[1] : null
  })
  .filter(Boolean)

// Create the new health check implementation
const envVarsObject = envVars
  .map((varName) => `    ${varName}: envVars.${varName}`)
  .join(",\n")

let checks = ""
if (dbVar) {
  checks = `
  // Add service-specific checks
  checks: [
    {
      name: "Database",
      check: async () => {
        try {
          // Simple query to check database connectivity
          await ${dbVar}.selectFrom("users").selectAll().limit(1).execute()
          return true
        } catch (error) {
          return false
        }
      },
    },
  ],`
}

const newImplementation = `import { envVars } from "@/env-vars"
${dbVar ? `import { ${dbVar} } from "@/lib/db"` : ""}
import type { HonoApp } from "@/types"
import { createHealthCheckRoute } from "@incmix-api/utils"

const healthcheckRoutes = createHealthCheckRoute<HonoApp>({
  // Pass all environment variables to check
  envVars: {
${envVarsObject}
  },
${checks}

  // Set OpenAPI tags
  tags: ["Health Check"],

  // Whether to require authentication for the health check endpoint
  requireAuth: false,
})

export default healthcheckRoutes
`

// Backup the old implementation
const indexPath = path.join(healthCheckDir, "index.ts")
const backupPath = path.join(healthCheckDir, "index.ts.bak")
fs.copyFileSync(indexPath, backupPath)
console.log(`✅ Backed up original implementation to ${backupPath}`)

// Write the new implementation
fs.writeFileSync(indexPath, newImplementation)
console.log(`✅ Updated health check implementation in ${indexPath}`)

// Update the route path in routes/index.ts if needed
const routesIndexPath = path.join(serviceDir, "src", "routes", "index.ts")
if (fs.existsSync(routesIndexPath)) {
  const routesContent = fs.readFileSync(routesIndexPath, "utf8")

  // Replace healthcheck with health-check in route path
  if (routesContent.includes("healthcheck")) {
    const updatedContent = routesContent.replace(
      /app\.route\(`\${BASE_PATH}\/healthcheck`/g,
      "app.route(`${BASE_PATH}/health-check`"
    )

    if (updatedContent !== routesContent) {
      fs.writeFileSync(routesIndexPath, updatedContent)
      console.log(`✅ Updated route path in ${routesIndexPath}`)
    }
  }
}

console.log("✨ Health check refactoring completed successfully!")
console.log("⚠️  Don't forget to test the new implementation.")
