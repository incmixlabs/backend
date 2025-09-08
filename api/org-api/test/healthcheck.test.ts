import Fastify from "fastify"
import { beforeEach, describe, expect, it } from "vitest"
import { BASE_PATH } from "../src/lib/constants"
import { routes } from "../src/routes"

describe("Healthcheck Routes", () => {
  let app: ReturnType<typeof Fastify>

  beforeEach(async () => {
    app = Fastify()
    await routes(app)
  })

  it("GET /healthcheck returns 200", async () => {
    const res = await app.inject({
      method: "GET",
      url: `${BASE_PATH}/healthcheck`,
    })
    expect(res.statusCode).toBe(200)
    expect(res.headers["content-type"]).toMatch(/application\/json/)
    // The healthcheck will return status DOWN if DB is not available, which is expected in tests
    const json = res.json()
    expect(json).toHaveProperty("status")
    expect(["ok", "DOWN"]).toContain(json.status)
  })
})
