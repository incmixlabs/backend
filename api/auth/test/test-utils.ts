import { Scrypt } from "lucia"

export const defaultHeaders = {
  origin: "http://localhost:1420",
  "accept-language": "en",
}

type User = {
  email: string
  password: string
  id: string
  emailVerified: boolean
}

export const insertUser = async (
  db: D1Database,
  { email, password, emailVerified = false, id }: User
) => {
  const hashedPassword = await new Scrypt().hash(password)
  return await db
    .prepare(
      "insert into users (id, email, hashed_password, email_verified, user_type) values (?,?,?,?,?) returning *"
    )
    .bind(id, email, hashedPassword, emailVerified, "member")
    .run()
}
