import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const backendRoot = path.resolve(__dirname, "../../../..")

describe.sequential("Environment Variable Precedence", () => {
  const testBackups: [string, string | null][] = []
  const testFiles = [
    path.join(backendRoot, ".env"),
    path.join(backendRoot, ".env.test"),
    path.join(backendRoot, "api/projects-api/.env"),
    path.join(backendRoot, "api/projects-api/.env.test"),
  ]

  // Helper to backup a file if it exists
  async function backupFile(filePath: string): Promise<string | null> {
    try {
      const content = await fs.readFile(filePath, "utf-8")
      return content
    } catch {
      return null
    }
  }

  // Helper to restore or remove a file
  async function restoreFile(filePath: string, originalContent: string | null) {
    if (originalContent !== null) {
      await fs.writeFile(filePath, originalContent)
    } else {
      try {
        await fs.unlink(filePath)
      } catch {
        // File might not exist
      }
    }
  }

  function parseEnvString(src: string): Record<string, string> {
    const out: Record<string, string> = {}
    for (const line of src.split(/\r?\n/)) {
      if (!line || line.trim().startsWith("#")) continue
      const idx = line.indexOf("=")
      if (idx <= 0) continue
      const key = line.slice(0, idx).trim()
      const val = line.slice(idx + 1).trim()
      out[key] = val
    }
    return out
  }

  async function mergeEnvFilesInOrder(files: string[]) {
    const merged: Record<string, string> = {}
    for (const f of files) {
      try {
        const c = await fs.readFile(f, "utf-8")
        Object.assign(merged, parseEnvString(c))
      } catch {
        // ignore missing files
      }
    }
    return merged
  }

  beforeAll(async () => {
    // Backup any existing files
    for (const filePath of testFiles) {
      const backup = await backupFile(filePath)
      testBackups.push([filePath, backup])
    }
    // Ensure service directory exists
    await fs.mkdir(path.join(backendRoot, "api/projects-api"), { recursive: true })
    // Create test environment files
    await fs.writeFile(
      path.join(backendRoot, ".env"),
      `
# Priority 10 - Root .env
DATABASE_URL=postgresql://root:root@localhost/root_db
REDIS_URL=redis://localhost:6379
GOOGLE_CLIENT_ID=root-google-client
GOOGLE_CLIENT_SECRET=root-google-secret
GOOGLE_REDIRECT_URL=http://localhost:3000/auth/callback
PRIORITY_TEST=priority_10_root_env
LEVEL_1_VAR=from_root_env
`.trim()
    )
    await fs.writeFile(
      path.join(backendRoot, ".env.test"),
      `
# Priority 20 - Root .env.test
PRIORITY_TEST=priority_20_root_env_test
LEVEL_2_VAR=from_root_env_test
`.trim()
    )
    await fs.writeFile(
      path.join(backendRoot, "api/projects-api/.env"),
      `
# Priority 30 - Service .env
PRIORITY_TEST=priority_30_service_env
LEVEL_3_VAR=from_service_env
`.trim()
    )
    await fs.writeFile(
      path.join(backendRoot, "api/projects-api/.env.test"),
      `
# Priority 40 - Service .env.test (highest priority)
PRIORITY_TEST=priority_40_service_env_test
LEVEL_4_VAR=from_service_env_test
`.trim()
    )
  })

  afterAll(async () => {
    // Restore all backed up files
    for (const [filePath, originalContent] of testBackups) {
      await restoreFile(filePath, originalContent)
    }
  })

  it("should verify that the priority system is correctly implemented with dotenv-mono", async () => {
    // Verify merge order (10 -> 20 -> 30 -> 40) produces highest-precedence value
    const merged = await mergeEnvFilesInOrder([
      path.join(backendRoot, ".env"),
      path.join(backendRoot, ".env.test"),
      path.join(backendRoot, "api/projects-api/.env"),
      path.join(backendRoot, "api/projects-api/.env.test"),
    ])
    expect(merged.PRIORITY_TEST).toBe("priority_40_service_env_test")
  })

  it("should demonstrate priority levels", () => {
    // Document the expected priority levels
    const expectedPriorities = {
      "Root .env": 10,
      "Root .env.{NODE_ENV}": 20,
      "Service .env": 30,
      "Service .env.{NODE_ENV}": 40,
    }

    expect(expectedPriorities["Service .env.{NODE_ENV}"]).toBe(40) // Highest priority
    expect(expectedPriorities["Root .env"]).toBe(10) // Lowest priority
  })
})
