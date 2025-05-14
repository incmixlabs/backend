import { envVars } from "@/env-vars"
import { S3Client } from "@aws-sdk/client-s3"

export const S3 = new S3Client({
  region: envVars.AWS_REGION,
  endpoint: envVars.AWS_ENDPOINT_URL_S3,
  forcePathStyle: true,
  tls: false,

  credentials: {
    accessKeyId: envVars.AWS_ACCESS_KEY_ID,
    secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
  },
})
