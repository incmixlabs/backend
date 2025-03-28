import { envVars } from "@/env-vars"
import { S3 } from "@/lib/s3"
import type { HonoApp } from "@/types"
import { ListObjectsV2Command } from "@aws-sdk/client-s3"
import { createHealthCheckRoute } from "@incmix-api/utils"

/**
 * Example implementation of the health check route using the shared utility
 * This is not being used yet - it's just an example of how the new utility could be used
 */
const healthcheckRoutes = createHealthCheckRoute<HonoApp>({
  // Pass all environment variables to check
  envVars: {
    AUTH_URL: envVars.AUTH_URL,
    BUCKET_NAME: envVars.BUCKET_NAME,
    COOKIE_NAME: envVars.COOKIE_NAME,
    DOMAIN: envVars.DOMAIN,
    INTL_URL: envVars.INTL_URL,
    AWS_ACCESS_KEY_ID: envVars.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: envVars.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: envVars.AWS_REGION,
    AWS_ENDPOINT_URL_S3: envVars.AWS_ENDPOINT_URL_S3,
  },
  
  // Add service-specific checks
  checks: [
    {
      name: "S3 Bucket",
      check: async () => {
        try {
          const command = new ListObjectsV2Command({
            Bucket: envVars.BUCKET_NAME,
            MaxKeys: 1,
          })
          await S3.send(command)
          return true
        } catch (error) {
          return false
        }
      },
    },
  ],
  
  // Set OpenAPI tags
  tags: ["Health Check"],
  
  // Require authentication (optional)
  requireAuth: true,
})

export default healthcheckRoutes