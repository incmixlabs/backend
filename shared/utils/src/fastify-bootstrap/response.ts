export const errorResponseSchema = {
  type: "object",
  properties: {
    message: { type: "string" },
    success: { type: "boolean" },
  },
}
export const responseSchema = {
  200: { ...errorResponseSchema },
  400: { ...errorResponseSchema },
  401: { ...errorResponseSchema },
  404: { ...errorResponseSchema },
  500: { ...errorResponseSchema },
}
export const UserSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    image: { type: "string" },
  },
  required: ["id", "name"],
}
export const auditSchema = {
  type: "object",
  properties: {
    createdAt: { type: "number" },
    updatedAt: { type: "number" },
    createdBy: { ...UserSchema },
    updatedBy: { ...UserSchema },
  },
  required: ["createdAt", "updatedAt", "createdBy", "updatedBy"],
}
