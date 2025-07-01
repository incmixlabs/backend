import { z } from "@hono/zod-openapi"

export const ProjectIdSchema = z.object({
  projectId: z.string().openapi({ example: "2hek2bkjh" }),
})

export const TaskIdSchema = z.object({
  taskId: z.string().openapi({ example: "2hek2bkjh" }),
})

export const IdSchema = z.object({
  id: z.string().openapi({ example: "2hek2bkjh" }),
})

export const CommentIdSchema = z.object({
  commentId: z.string().openapi({ example: "2hek2bkjh" }),
})

export const AddCommentSchema = z.object({
  comment: z.object({
    content: z.string().openapi({ example: "This is a comment" }),
  }),
  type: z.enum(["task", "project"]).openapi({ example: "task" }),
})

export const UpdateCommentSchema = z.object({
  comment: z.object({
    content: z.string().openapi({ example: "Updated comment content" }),
  }),
})
