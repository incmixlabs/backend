export const PullProjectsQuerySchema = {
  type: "object",
  properties: {
    lastPulledAt: { type: "string" },
  },
}

export const ProjectWithTimeStampsSchema = {
  type: "object",
  required: [
    "id",
    "name",
    "orgId",
    "status",
    "createdAt",
    "updatedAt",
    "createdBy",
    "updatedBy",
  ],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    description: { type: ["string", "null"] },
    orgId: { type: "string" },
    company: { type: ["string", "null"] },
    logo: { type: ["string", "null"] },
    status: {
      type: "string",
      enum: ["started", "on-hold", "completed", "all"],
    },
    budget: { type: ["number", "null"] },
    startDate: { type: ["number", "null"] },
    endDate: { type: ["number", "null"] },
    createdAt: { type: "number" },
    updatedAt: { type: "number" },
    createdBy: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        image: { type: "string" },
      },
      required: ["id", "name"],
    },
    updatedBy: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        image: { type: "string" },
      },
      required: ["id", "name"],
    },
  },
}
