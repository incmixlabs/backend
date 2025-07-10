import {
  ListFilesSchema,
  QueryFileName,
  ResponseSchema,
  UploadFileSchema,
} from "@/routes/files/types"
import { createRoute } from "@hono/zod-openapi"
import { presignedUrlSchema } from "./types"

export const uploadFile = createRoute({
  method: "put",
  path: "/upload",
  summary: "Upload File (Local Development Only)",
  request: {
    query: QueryFileName,
    body: {
      content: {
        "application/octet-stream": {
          schema: UploadFileSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "File Upload successful",
    },
    400: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Invalid Request Error",
    },
    500: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
    501: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Not implemented",
    },
  },
})

export const downloadFile = createRoute({
  method: "get",
  path: "/download",
  summary: "Download File (Local Development Only)",
  security: [{ cookieAuth: [] }],
  request: {
    query: QueryFileName,
  },
  responses: {
    200: {
      // NOTE: 'content' unfortunately doesn't work with streaming responses,
      // so the response will have no type.
      // See [https://github.com/orgs/honojs/discussions/1803].
      description: "File Download Successful",
    },
    400: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Invalid Request Error",
    },
    404: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "File Not Found",
    },
    500: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
    501: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Not implemented",
    },
  },
})

export const deleteFile = createRoute({
  method: "delete",
  path: "/delete",
  summary: "Delete File (Local Development Only)",
  security: [{ cookieAuth: [] }],
  request: {
    query: QueryFileName,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "File Deleted Successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Invalid Request Error",
    },
    401: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Unauthorized User",
    },
    404: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "File Not Found",
    },
    500: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
    501: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Not implemented",
    },
  },
})

export const listFiles = createRoute({
  method: "get",
  path: "/list",
  summary: "List Files (Local Development Only)",
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ListFilesSchema,
        },
      },
      description: "File Listing Successful",
    },
    401: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Unauthorized User",
    },
    500: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
    501: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Not implemented",
    },
  },
})

export const presignedUpload = createRoute({
  method: "get",
  path: "/presigned-upload",
  summary: "Get Presigned URL for Upload",
  security: [{ cookieAuth: [] }],
  request: {
    query: QueryFileName,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: presignedUrlSchema,
        },
      },
      description: "Presigned URL Generated Successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Invalid Request Error",
    },
    401: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Unauthorized User",
    },
    500: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
  },
})

export const presignedDownload = createRoute({
  method: "get",
  path: "/presigned-download",
  summary: "Get Presigned URL for Download",
  security: [{ cookieAuth: [] }],
  request: {
    query: QueryFileName,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: presignedUrlSchema,
        },
      },
      description: "Presigned URL Generated Successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Invalid Request Error",
    },
    401: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Unauthorized User",
    },
    500: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
  },
})

export const presignedDelete = createRoute({
  method: "get",
  path: "/presigned-delete",
  summary: "Get Presigned URL for Delete",
  security: [{ cookieAuth: [] }],
  request: {
    query: QueryFileName,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: presignedUrlSchema,
        },
      },
      description: "Presigned URL Generated Successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Invalid Request Error",
    },
    401: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Unauthorized User",
    },
    500: {
      content: {
        "application/json": {
          schema: ResponseSchema,
        },
      },
      description: "Internal Server Error",
    },
  },
})
