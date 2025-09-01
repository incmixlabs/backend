import path from "node:path"
import { fileURLToPath } from "node:url"
import { load } from "dotenv-mono"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const backendRoot = path.resolve(__dirname, "../..")
const serviceDir = path.join(backendRoot, "api", "auth")
// Clear existing env vars for testing
delete process.env.DATABASE_URL
delete process.env.GOOGLE_REDIRECT_URL

console.log("Before load:")
console.log("- DATABASE_URL:", process.env.DATABASE_URL)
console.log("- GOOGLE_REDIRECT_URL:", process.env.GOOGLE_REDIRECT_URL)

const result = load({
  path: backendRoot,
  priorities: {
    [path.join(backendRoot, ".env")]: 10,
    [path.join(backendRoot, ".env.test")]: 20,
    [path.join(serviceDir, ".env")]: 30,
    [path.join(serviceDir, ".env.test")]: 40,
  },
  expand: true,
  override: true,
})

console.log("\nAfter load:")
console.log("- DATABASE_URL:", process.env.DATABASE_URL)
console.log("- GOOGLE_REDIRECT_URL:", process.env.GOOGLE_REDIRECT_URL)
console.log("\nLoad result:", result)
