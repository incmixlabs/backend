import { envVars } from "@/env-vars"
import { S3 } from "@/lib/s3"
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
      AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY,
      AWS_REGION,
      AWS_ENDPOINT_URL_S3,
    } = envVars

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

    if (!AWS_ACCESS_KEY_ID) {
      status = "DOWN"
      missing.push("AWS_ACCESS_KEY_ID")
    }
    if (!AWS_SECRET_ACCESS_KEY) {
      status = "DOWN"
      missing.push("AWS_SECRET_ACCESS_KEY")
    }
    if (!AWS_REGION) {
      status = "DOWN"
      missing.push("AWS_REGION")
    }
    if (!AWS_ENDPOINT_URL_S3) {
      status = "DOWN"
      missing.push("AWS_ENDPOINT_URL_S3")
    }

    const command = new ListObjectsV2Command({
      Bucket: envVars.BUCKET_NAME,
      MaxKeys: 1,
    })
    await S3.send(command)

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
