import { z } from "zod"

export const ProjectIdSchema = z.object({
  projectId: z.string(),
})

export const TaskIdSchema = z.object({
  taskId: z.string(),
})

export const IdSchema = z.object({
  id: z.string(),
})

export const CommentIdSchema = z.object({
  commentId: z.string(),
})

export const AddCommentSchema = z.object({
  comment: z.object({
    content: z.string(),
  }),
  type: z.enum(["task", "project"]),
})

export const UpdateCommentSchema = z.object({
  comment: z.object({
    content: z.string(),
  }),
})
