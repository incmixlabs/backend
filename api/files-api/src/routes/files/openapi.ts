import { z } from "zod"
import {
  ListFilesSchema,
  PresignedUrlSchema,
  QueryFileNameSchema,
  ResponseSchema,
  UploadFileSchema,
} from "./types"

const ErrorSchema = z.object({
  error: z.string(),
})

export const uploadFileSchema = {
  querystring: QueryFileNameSchema,
  body: UploadFileSchema,
  response: {
    200: ResponseSchema,
    400: ErrorSchema,
    500: ErrorSchema,
    501: ErrorSchema,
  },
}

export const downloadFileSchema = {
  querystring: QueryFileNameSchema,
  response: {
    200: z.any(), // Binary file response
    400: ErrorSchema,
    404: ErrorSchema,
    500: ErrorSchema,
    501: ErrorSchema,
  },
}

export const deleteFileSchema = {
  querystring: QueryFileNameSchema,
  response: {
    200: ResponseSchema,
    400: ErrorSchema,
    401: ErrorSchema,
    404: ErrorSchema,
    500: ErrorSchema,
    501: ErrorSchema,
  },
}

export const listFilesSchema = {
  response: {
    200: ListFilesSchema,
    401: ErrorSchema,
    500: ErrorSchema,
    501: ErrorSchema,
  },
}

export const presignedUploadSchema = {
  querystring: QueryFileNameSchema,
  response: {
    200: PresignedUrlSchema,
    400: ErrorSchema,
    401: ErrorSchema,
    500: ErrorSchema,
  },
}

export const presignedDownloadSchema = {
  querystring: QueryFileNameSchema,
  response: {
    200: PresignedUrlSchema,
    400: ErrorSchema,
    401: ErrorSchema,
    500: ErrorSchema,
  },
}

export const presignedDeleteSchema = {
  querystring: QueryFileNameSchema,
  response: {
    200: PresignedUrlSchema,
    400: ErrorSchema,
    401: ErrorSchema,
    500: ErrorSchema,
  },
}
