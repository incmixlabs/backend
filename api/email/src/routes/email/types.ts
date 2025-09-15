// TODO: Implement email types
// These are placeholder types that need proper implementation

export const MessageResponseSchema = {
  type: "object",
  properties: {
    message: { type: "string" },
  },
}

export const RequestSchema = {
  type: "object",
  properties: {
    to: { type: "string" },
    subject: { type: "string" },
    body: { type: "string" },
  },
}
