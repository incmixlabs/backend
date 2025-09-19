import { fastify } from "fastify"
import { describe, expect, it } from "vitest"
import { registerCorsPlugin } from "./cors"

describe("CORS Plugin Integration", () => {
  it("should register CORS plugin with default options", async () => {
    const app = fastify()

    await registerCorsPlugin(app, {})

    // Test that the plugin is registered by making a request
    app.get("/test", async () => {
      return { message: "test" }
    })

    const response = await app.inject({
      method: "GET",
      url: "/test",
      headers: {
        origin: "https://example.com",
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers["access-control-allow-origin"]).toBe("*")
  })

  it("should handle credentials with specific origin", async () => {
    const app = fastify()

    await registerCorsPlugin(app, {
      origin: "https://trusted.com",
      credentials: true,
    })

    app.get("/test", async () => {
      return { message: "test" }
    })

    const response = await app.inject({
      method: "GET",
      url: "/test",
      headers: {
        origin: "https://trusted.com",
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers["access-control-allow-origin"]).toBe(
      "https://trusted.com"
    )
    expect(response.headers["access-control-allow-credentials"]).toBe("true")
  })

  it("should handle array of allowed origins", async () => {
    const app = fastify()

    await registerCorsPlugin(app, {
      origin: ["https://trusted1.com", "https://trusted2.com"],
      credentials: true,
    })

    app.get("/test", async () => {
      return { message: "test" }
    })

    const response = await app.inject({
      method: "GET",
      url: "/test",
      headers: {
        origin: "https://trusted1.com",
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers["access-control-allow-origin"]).toBe(
      "https://trusted1.com"
    )
    expect(response.headers["access-control-allow-credentials"]).toBe("true")
  })

  it("should handle OPTIONS preflight requests", async () => {
    const app = fastify()

    await registerCorsPlugin(app, {
      origin: "https://trusted.com",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })

    app.get("/test", async () => {
      return { message: "test" }
    })

    const response = await app.inject({
      method: "OPTIONS",
      url: "/test",
      headers: {
        origin: "https://trusted.com",
        "access-control-request-method": "POST",
        "access-control-request-headers": "Content-Type",
      },
    })

    expect(response.statusCode).toBe(204)
    expect(response.headers["access-control-allow-origin"]).toBe(
      "https://trusted.com"
    )
    expect(response.headers["access-control-allow-credentials"]).toBe("true")
    expect(response.headers["access-control-allow-methods"]).toContain("POST")
    expect(response.headers["access-control-allow-headers"]).toContain(
      "Content-Type"
    )
  })

  it("should reject non-allowed origins when using array", async () => {
    const app = fastify()

    await registerCorsPlugin(app, {
      origin: ["https://trusted1.com", "https://trusted2.com"],
      credentials: true,
    })

    app.get("/test", async () => {
      return { message: "test" }
    })

    const response = await app.inject({
      method: "GET",
      url: "/test",
      headers: {
        origin: "https://malicious.com",
      },
    })

    expect(response.statusCode).toBe(200)
    // @fastify/cors should not set the origin header for non-allowed origins
    expect(response.headers["access-control-allow-origin"]).toBeUndefined()
  })
})
