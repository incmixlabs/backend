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
    "createdAt",
    "updatedAt",
    "createdBy",
    "updatedBy",
  ],
  properties: {
    id: { type: "string" },
    projectId: { type: "string" },
    type: { type: "string" },
    name: { type: "string" },
    description: { type: ["string", "null"] },
    color: { type: "string" },
    order: { type: "number" },
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
