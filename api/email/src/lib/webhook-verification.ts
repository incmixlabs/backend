import { createHmac } from "node:crypto"

/**
 * Verifies the signature of a Resend webhook
 * @param body - The raw webhook body
 * @param signature - The signature header from the webhook
 * @param webhookSecret - The webhook secret from Resend
 * @returns boolean indicating if the signature is valid
 */
export function verifyResendWebhookSignature(
  body: string,
  signature: string,
  webhookSecret: string
): boolean {
  try {
    // Resend uses HMAC-SHA256 for webhook signatures
    const expectedSignature = createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex")

    // Compare the expected signature with the received signature
    return expectedSignature === signature
  } catch (error) {
    console.error("Error verifying webhook signature:", error)
    return false
  }
}
