export const QueryFileNameSchema = {
  type: "object",
  properties: {
    fileName: { type: "string" },
    date: { type: "string" },
  },
  required: ["fileName"],
}

export const PresignedUrlResponseSchema = {
  type: "object",
  properties: {
    url: { type: "string" },
  },
  required: ["url"],
}

export const ListFilesResponseSchema = {
  type: "object",
  properties: {
    files: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          size: { type: "number" },
          uploaded: { type: "string" },
        },
        required: ["name", "size", "uploaded"],
      },
    },
  },
  required: ["files"],
}

export const MessageResponseSchema = {
  type: "object",
  properties: {
    message: { type: "string" },
  },
  required: ["message"],
}
