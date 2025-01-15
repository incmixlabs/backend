import { getS3Client } from "@/index"
import { healthCheck } from "@/routes/healthcheck/openapi"
import type { HonoApp } from "@/types"
import { ListObjectsV2Command } from "@aws-sdk/client-s3"
import { OpenAPIHono } from "@hono/zod-openapi"

const healthcheckRoutes = new OpenAPIHono<HonoApp>()
healthcheckRoutes.openapi(healthCheck, async (c) => {
  try {
    const {
      AUTH_URL,
      BUCKET_NAME,
      COOKIE_NAME,
      DOMAIN,
      INTL_URL,
      R2_ACCESS_KEY_ID,
      R2_ENDPOINT,
      R2_SECRET_ACCESS_KEY,
    } = c.env

    let status = "UP"
    const missing: string[] = []

    if (!AUTH_URL) {
      status = "DOWN"
      missing.push("AUTH_URL")
    }

    if (!BUCKET_NAME) {
      status = "DOWN"
      missing.push("BUCKET_NAME")
    }
    if (!COOKIE_NAME) {
      status = "DOWN"
      missing.push("COOKIE_NAME")
    }
    if (!DOMAIN) {
      status = "DOWN"
      missing.push("DOMAIN")
    }
    if (!INTL_URL) {
      status = "DOWN"
      missing.push("INTL_URL")
    }
    if (!R2_ACCESS_KEY_ID) {
      status = "DOWN"
      missing.push("R2_ACCESS_KEY_ID")
    }
    if (!R2_ENDPOINT) {
      status = "DOWN"
      missing.push("R2_ENDPOINT")
    }
    if (!R2_SECRET_ACCESS_KEY) {
      status = "DOWN"
      missing.push("R2_SECRET_ACCESS_KEY")
    }

    const s3Client = await getS3Client(c)
    const command = new ListObjectsV2Command({
      Bucket: c.env.BUCKET_NAME,
      MaxKeys: 1,
    })
    await s3Client.send(command)

    return c.json(
      {
        status,
        reason:
          missing.length > 0
            ? `Env variables missing: [${missing.join(", ")}]`
            : undefined,
      },
      200
    )
  } catch (error) {
    let reason = "R2 Bucket error"
    if (error instanceof Error) reason = error.message
    return c.json(
      {
        status: "DOWN",
        reason,
      },
      200
    )
  }
})

export default healthcheckRoutes
