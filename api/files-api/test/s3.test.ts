import { envVars } from "@/env-vars"
import { S3 } from "@/lib/s3"
import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3"
import { describe, expect, it, vi } from "vitest"

// Mock AWS SDK
vi.mock("@aws-sdk/client-s3")
vi.mock("@/env-vars", () => ({
  envVars: {
    AWS_REGION: "us-east-1",
    AWS_ACCESS_KEY_ID: "test-access-key",
    AWS_SECRET_ACCESS_KEY: "test-secret-key",
    AWS_ENDPOINT_URL_S3: undefined,
    BUCKET_NAME: "test-bucket",
    PORT: "3000",
  },
}))

describe("S3 client", () => {
  it("should be initialized with correct configuration", () => {
    expect(S3Client).toHaveBeenCalledWith({
      region: envVars.AWS_REGION,
      endpoint: envVars.AWS_ENDPOINT_URL_S3,
      forcePathStyle: true,
      tls: false,
      credentials: {
        accessKeyId: envVars.AWS_ACCESS_KEY_ID,
        secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
      },
    })
  })

  it("should be an instance of S3Client", () => {
    expect(S3).toBeInstanceOf(S3Client)
  })

  it("should be able to check bucket existence", async () => {
    // Mock the send method
    const mockSend = vi.fn().mockResolvedValue({
      $metadata: { httpStatusCode: 200 },
    })

    // Set the mocked send method on the S3 client
    vi.mocked(S3).send = mockSend

    // Execute a HeadBucket command
    await S3.send(new HeadBucketCommand({ Bucket: envVars.BUCKET_NAME }))

    // Verify the command was sent with correct parameters
    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(mockSend.mock.calls[0][0]).toBeInstanceOf(HeadBucketCommand)
  })

  it("should handle bucket not found error", async () => {
    // Mock send method to throw a NoSuchBucket error
    const mockSend = vi.fn().mockRejectedValue({
      name: "NoSuchBucket",
      $metadata: { httpStatusCode: 404 },
    })

    // Set the mocked send method on the S3 client
    vi.mocked(S3).send = mockSend

    // Execute a HeadBucket command and expect it to throw
    await expect(
      S3.send(new HeadBucketCommand({ Bucket: envVars.BUCKET_NAME }))
    ).rejects.toMatchObject({
      name: "NoSuchBucket",
    })
  })
})
