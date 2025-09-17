import { ListObjectsV2Command } from "@aws-sdk/client-s3"
import type { FastifyInstance } from "fastify"
import { envVars } from "@/env-vars"
import { S3 } from "@/lib/s3"


export const setupHealthcheckRoutes = async (app: FastifyInstance) => {
  app.get(
    "/healthcheck",
    {
      schema: {
        description: "Health check endpoint",
        tags: ["health"],
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string" },
              timestamp: { type: "string" },
              environment: {
                type: "object",
                properties: {
                  AUTH_API_URL: { type: "boolean" },
                  BUCKET_NAME: { type: "boolean" },
                  COOKIE_NAME: { type: "boolean" },
                  DOMAIN: { type: "boolean" },
                  INTL_API_URL: { type: "boolean" },
                  AWS_ACCESS_KEY_ID: { type: "boolean" },
                  AWS_SECRET_ACCESS_KEY: { type: "boolean" },
                  AWS_REGION: { type: "boolean" },
                  AWS_ENDPOINT_URL_S3: { type: "boolean" },
                },
              },
              checks: {
                type: "object",
                properties: {
                  "S3 Bucket": { type: "boolean" },
                },
              },
            },
          },
          503: {
            type: "object",
            properties: {
              status: { type: "string" },
              timestamp: { type: "string" },
              environment: {
                type: "object",
                properties: {
                  AUTH_API_URL: { type: "boolean" },
                  BUCKET_NAME: { type: "boolean" },
                  COOKIE_NAME: { type: "boolean" },
                  DOMAIN: { type: "boolean" },
                  INTL_API_URL: { type: "boolean" },
                  AWS_ACCESS_KEY_ID: { type: "boolean" },
                  AWS_SECRET_ACCESS_KEY: { type: "boolean" },
                  AWS_REGION: { type: "boolean" },
                  AWS_ENDPOINT_URL_S3: { type: "boolean" },
                },
              },
              checks: {
                type: "object",
                properties: {
                  "S3 Bucket": { type: "boolean" },
                },
              },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      const checks: Record<string, boolean> = {}

      // Check S3 connection
      try {
        const command = new ListObjectsV2Command({
          Bucket: envVars.BUCKET_NAME,
          MaxKeys: 1,
        })
        await S3.send(command)
        checks["S3 Bucket"] = true
      } catch (_error) {
        checks["S3 Bucket"] = false
      }

      const environment = {
        AUTH_API_URL: !!envVars.AUTH_API_URL,
        BUCKET_NAME: !!envVars.BUCKET_NAME,
        COOKIE_NAME: !!envVars.COOKIE_NAME,
        DOMAIN: !!envVars.DOMAIN,
        INTL_API_URL: !!envVars.INTL_API_URL,
        AWS_ACCESS_KEY_ID: !!envVars.AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: !!envVars.AWS_SECRET_ACCESS_KEY,
        AWS_REGION: !!envVars.AWS_REGION,
        AWS_ENDPOINT_URL_S3: !!envVars.AWS_ENDPOINT_URL_S3,
      }

      const allChecksPass = Object.values(checks).every(Boolean)
      const allEnvVarsSet = Object.values(environment).every(Boolean)
      const status = allChecksPass && allEnvVarsSet ? "healthy" : "unhealthy"

      return reply.status(status === "healthy" ? 200 : 503).send({
        status,
        timestamp: new Date().toISOString(),
        environment,
        checks,
      })
    }
  )
}
