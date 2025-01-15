import { BASE_PATH, ERROR_R2_MISSING } from "@/lib/constants"
import type { HonoApp } from "@/types"
import { S3Client } from "@aws-sdk/client-s3"
import { OpenAPIHono } from "@hono/zod-openapi"
import type { Context } from "hono"

import { middlewares } from "@/middleware"
import { routes } from "@/routes"
import { KVStore } from "@incmix-api/utils/kv-store"
import { setupKvStore, useTranslation } from "@incmix-api/utils/middleware"

const app = new OpenAPIHono<HonoApp>()

const globalStore = new KVStore()

setupKvStore(app, BASE_PATH, globalStore)

let global_s3Client: S3Client

export async function getS3Client(c: Context) {
  if (
    !c.env.R2_ENDPOINT ||
    !c.env.R2_ACCESS_KEY_ID ||
    !c.env.R2_SECRET_ACCESS_KEY
  ) {
    const t = await useTranslation(c)
    const msg = await t.text(ERROR_R2_MISSING)
    throw new Error(msg)
  }

  if (!global_s3Client) {
    global_s3Client = new S3Client({
      region: "auto",
      endpoint: c.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: c.env.R2_ACCESS_KEY_ID,
        secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
      },
    })
  }

  return global_s3Client
}

middlewares(app)
routes(app)

export default app
