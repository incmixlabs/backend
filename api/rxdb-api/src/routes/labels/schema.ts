import { auditSchema } from "@incmix-api/utils/fastify-bootstrap"
export const PullLabelsQuerySchema = {
  type: "object",
  properties: {
    lastPulledAt: { type: "string" },
  },
}

export const LabelWithTimeStampsSchema = {
  type: "object",
  required: [
    "id",
    "projectId",
    "type",
    "name",
    "color",
    "order",
    [...auditSchema.required],
  ],
  properties: {
    id: { type: "string" },
    projectId: { type: "string" },
    type: { type: "string" },
    name: { type: "string" },
    description: { type: ["string", "null"] },
    color: { type: "string" },
    order: { type: "number" },
    ...auditSchema.properties,
  },
}

export const PushLabelsBodySchema = {
  type: "object",
  required: ["changeRows"],
  properties: {
    changeRows: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          newDocumentState: LabelWithTimeStampsSchema,
          assumedMasterState: LabelWithTimeStampsSchema,
        },
        required: ["newDocumentState"],
      },
    },
  },
}
