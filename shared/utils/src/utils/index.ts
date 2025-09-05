export * from "../db-operations"
export * from "../env-config"
export * from "../error-constants"
export * from "../service-bootstrap"
export * from "../service-bootstrap/types"
export * from "./constants"
export * from "./data-table"
export * from "./health-check"
export * from "./health-check-simplified"
export * from "./i18n-helper"
export * from "./sentry"

/**
 * Recursively searches for the project root directory by looking for 'pnpm-workspace.yaml'
 * in the current directory and its parent directories.
 *
 * @param startDir - The directory to start searching from. Defaults to process.cwd().
 * @returns The absolute path to the project root directory, or null if not found.
 */
export async function findProjectRoot(
  startDir?: string
): Promise<string | null> {
  // Use dynamic import for node:fs and node:path to avoid top-level import
  const fs = await import("node:fs/promises")
  const path = await import("node:path")

  let currentDir = startDir || process.cwd()
  const root = path.parse(currentDir).root

  while (true) {
    const candidate = path.join(currentDir, "pnpm-workspace.yaml")
    try {
      await fs.access(candidate)
      return currentDir
    } catch {
      // Not found, go up
    }
    if (currentDir === root) {
      break
    }
    currentDir = path.dirname(currentDir)
  }
  return null
}
