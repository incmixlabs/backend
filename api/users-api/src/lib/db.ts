import type { Context } from "@/types"

export function getUserByEmail(c: Context, email: string) {
  return c
    .get("db")
    .selectFrom("users")
    .selectAll()
    .where("email", "=", email)
    .executeTakeFirst()
}
