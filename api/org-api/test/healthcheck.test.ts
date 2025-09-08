import { beforeAll, describe, expect, it } from "vitest"
import Fastify from "fastify"
import { routes } from "../src/routes"
import { BASE_PATH } from "../src/lib/constants"

describe("Healthcheck Routes", () => {
  const app = Fastify()
  beforeAll(async () => {
    await routes(app)
  })

  it("GET /healthcheck returns 200 and minimal payload", async () => {
    const res = await app.inject({
      method: "GET",
      url: `${BASE_PATH}/healthcheck`,
    })
    expect(res.statusCode).toBe(200)
    expect(res.headers["content-type"]).toMatch(/application\/json/)
    expect(res.json()).toMatchObject({ status: "ok" })
  })
})
