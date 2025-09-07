import { ProjectSchema } from "@incmix-api/utils/zod-schema"
import { z } from "zod"
import { ResponseSchema } from "../types"
import {
  AddProjectChecklistSchema,
  AddProjectMemberSchema,
  ChecklistIdSchema,
  CreateProjectSchema,
  IdSchema,
  OrgIdSchema,
  ProjectListSchema,
  RemoveProjectChecklistSchema,
  RemoveProjectMemberSchema,
  UpdateProjectChecklistSchema,
  UpdateProjectSchema,
} from "./types"

export const createProjectSchema = {
  body: CreateProjectSchema,
  response: {
    201: ProjectSchema,
    400: ResponseSchema,
    401: ResponseSchema,
    500: ResponseSchema,
  },
}

export const listProjectsSchema = {
  params: OrgIdSchema,
  response: {
    200: ProjectListSchema,
    401: ResponseSchema,
    404: ResponseSchema,
    500: ResponseSchema,
  },
}

export const addProjectMembersSchema = {
  params: IdSchema,
  body: AddProjectMemberSchema,
  response: {
    200: ProjectSchema,
    401: ResponseSchema,
    404: ResponseSchema,
    409: ResponseSchema,
    500: ResponseSchema,
  },
}

export const removeProjectMembersSchema = {
  params: IdSchema,
  body: RemoveProjectMemberSchema,
  response: {
    200: ProjectSchema,
    401: ResponseSchema,
    404: ResponseSchema,
    500: ResponseSchema,
  },
}

export const updateProjectSchema = {
  params: IdSchema,
  body: UpdateProjectSchema,
  response: {
    200: ProjectSchema,
    401: ResponseSchema,
    404: ResponseSchema,
    500: ResponseSchema,
  },
}

export const deleteProjectSchema = {
  params: IdSchema,
  response: {
    200: ResponseSchema,
    401: ResponseSchema,
    404: ResponseSchema,
    500: ResponseSchema,
  },
}

export const addProjectChecklistSchema = {
  params: IdSchema,
  body: AddProjectChecklistSchema,
  response: {
    201: ProjectSchema,
    401: ResponseSchema,
    404: ResponseSchema,
    500: ResponseSchema,
  },
}

export const updateProjectChecklistSchema = {
  params: ChecklistIdSchema,
  body: UpdateProjectChecklistSchema,
  response: {
    200: ProjectSchema,
    401: ResponseSchema,
    404: ResponseSchema,
    500: ResponseSchema,
  },
}

export const removeProjectChecklistSchema = {
  params: IdSchema,
  body: RemoveProjectChecklistSchema,
  response: {
    200: ProjectSchema,
    401: ResponseSchema,
    404: ResponseSchema,
    500: ResponseSchema,
  },
}

export const getProjectMembersSchema = {
  params: IdSchema,
  response: {
    200: z.array(
      z.object({
        id: z.string(),
        role: z.string(),
        isOwner: z.boolean(),
        name: z.string(),
        email: z.string(),
        avatar: z.string().nullable(),
      })
    ),
    401: ResponseSchema,
    404: ResponseSchema,
    500: ResponseSchema,
  },
}

export const getProjectReferenceSchema = {
  response: {
    200: z.object({
      statuses: z.array(z.string()),
      roles: z.array(z.string()),
      priorities: z.array(z.string()),
    }),
    401: ResponseSchema,
    500: ResponseSchema,
  },
}
