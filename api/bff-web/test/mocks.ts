import { type Miniflare, type Request, Response } from "miniflare"

export const authService = async (req: Request, mf: Miniflare) => {
  await mf.ready

  const url = new URL(req.url)
  const pathname = url.pathname
  const searchParams = url.searchParams

  // Test route: validate-session (no params)
  if (pathname.endsWith("/validate-session")) {
    return Response.json({
      id: "user_1",
      email: "user@example.com",
      emailVerified: true,
    })
  }

  // Test route: login (with body)
  if (pathname.endsWith("/login")) {
    const body = await req.json()

    if (
      typeof body !== "object" ||
      body === null ||
      !("email" in body) ||
      !("password" in body)
    ) {
      return Response.json({ message: "Invalid body" }, { status: 401 })
    }

    if (body.email === "user@example.com" && body.password === "password") {
      return Response.json({
        user: {
          id: "user_1",
          email: "user@example.com",
          emailVerified: true,
        },
        session: {
          id: "session_1",
        },
      })
    }
    return Response.json({ message: "Invalid credentials" }, { status: 401 })
  }

  // Test route: get users (with query params)
  if (pathname.endsWith("/users")) {
    const email = searchParams.get("email")
    const id = searchParams.get("id")

    if (email === "user@example.com" || id === "user_1") {
      return Response.json({
        id: "user_1",
        email: "user@example.com",
        emailVerified: true,
      })
    }
    return Response.json({ message: "User not found" }, { status: 404 })
  }

  return Response.json({ message: "Not found" }, { status: 404 })
}

export const dummyService = async (_: Request, mf: Miniflare) => {
  await mf.ready
  return Response.json(
    { message: "Service not implemented in test environment" },
    { status: 501 }
  )
}
