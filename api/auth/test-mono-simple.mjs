import { load } from "dotenv-mono"

// Clear existing env vars for testing
delete process.env.DATABASE_URL
delete process.env.GOOGLE_REDIRECT_URL

console.log("Before load:")
console.log("- DATABASE_URL:", process.env.DATABASE_URL)
console.log("- GOOGLE_REDIRECT_URL:", process.env.GOOGLE_REDIRECT_URL)

const result = load({
  path: "/Users/umam3/projects/venturaz/incmix/backend",
  priorities: {
    "/Users/umam3/projects/venturaz/incmix/backend/.env": 10,
    "/Users/umam3/projects/venturaz/incmix/backend/.env.test": 20,
    "/Users/umam3/projects/venturaz/incmix/backend/api/auth/.env": 30,
    "/Users/umam3/projects/venturaz/incmix/backend/api/auth/.env.test": 40,
  },
  expand: true,
  override: true,
})

console.log("\nAfter load:")
console.log("- DATABASE_URL:", process.env.DATABASE_URL)
console.log("- GOOGLE_REDIRECT_URL:", process.env.GOOGLE_REDIRECT_URL)
console.log("\nLoad result:", result)