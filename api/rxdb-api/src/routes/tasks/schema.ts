export const PullTasksQuerySchema = {
  type: "object",
  properties: {
    lastPulledAt: { type: "string" },
  },
}

export const TaskWithTimeStampsSchema = {
  type: "object",
  required: [
    "id",
    "name",
    "description",
    "completed",
    "projectId",
    "statusId",
    "priorityId",
    "taskOrder",
    "createdAt",
    "updatedAt",
    "createdBy",
    "updatedBy",
    "assignedTo",
    "isSubtask",
  ],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    description: { type: "string" },
    completed: { type: "boolean" },
    projectId: { type: "string" },
    statusId: { type: "string" },
    priorityId: { type: "string" },
    taskOrder: { type: "number" },
    startDate: { type: ["number", "null"] },
    endDate: { type: ["number", "null"] },
    acceptanceCriteria: { type: "array" },
    labelsTags: { type: "array" },
    refUrls: { type: "array" },
    attachments: { type: "array" },
    checklist: { type: "array" },
    parentTaskId: { type: ["string", "null"] },
    createdAt: { type: "number" },
    updatedAt: { type: "number" },
    isSubtask: { type: "boolean" },
    assignedTo: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          image: { type: "string" },
        },
        required: ["id", "name"],
      },
    },
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

export const PushTasksBodySchema = {
  type: "object",
  required: ["changeRows"],
  properties: {
    changeRows: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          newDocumentState: TaskWithTimeStampsSchema,
          assumedMasterState: TaskWithTimeStampsSchema,
        },
        required: ["newDocumentState"],
      },
    },
  },
}
