import Ajv from "ajv"
import addFormats from "ajv-formats"
import { projectStatus } from "@incmix-api/utils/db-schema"

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)

export const taskStatusEnum = [
  "backlog",
  "active", 
  "on_hold",
  "cancelled",
  "archived",
] as const
export type TaskStatus = (typeof taskStatusEnum)[number]

export const labelTypeEnum = ["status", "priority"] as const
export type LabelType = (typeof labelTypeEnum)[number]

export const timeTypeEnum = ["day", "days", "week", "month", "year"] as const
export type TimeType = (typeof timeTypeEnum)[number]

const UserSchema = {
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
      example: "user123"
    },
    name: {
      type: "string", 
      maxLength: 200,
      example: "John Doe"
    },
    image: {
      type: "string",
      maxLength: 500,
      example: "https://example.com/avatar.png"
    }
  },
  required: ["id", "name"],
  additionalProperties: false,
  example: {
    id: "user123",
    name: "John Doe",
    image: "https://example.com/avatar.png",
  }
} as const

export interface User {
  id: string
  name: string
  image?: string
}

export const ChecklistItemSchema = {
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
      example: "item123"
    },
    text: {
      type: "string",
      maxLength: 500,
      example: "Checklist item text"
    },
    checked: {
      type: "boolean",
      default: false,
      example: false
    },
    order: {
      type: "integer",
      minimum: 0,
      default: 0,
      example: 1
    }
  },
  required: ["id", "text"],
  additionalProperties: false,
  example: {
    id: "item123",
    text: "Checklist item text", 
    checked: false,
    order: 1,
  }
} as const

export interface ChecklistItem {
  id: string
  text: string
  checked?: boolean
  order?: number
}

export const CommentSchema = {
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
      example: "comment123"
    },
    content: {
      type: "string",
      maxLength: 2000,
      example: "Comment content"
    },
    createdAt: {
      type: "number",
      example: 1640995200000
    },
    createdBy: UserSchema
  },
  required: ["id", "content", "createdAt", "createdBy"],
  additionalProperties: false,
  example: {
    id: "comment123",
    content: "Comment content",
    createdAt: 1640995200000,
    createdBy: {
      id: "user123",
      name: "John Doe",
      image: "https://example.com/avatar.png",
    },
  }
} as const

export interface Comment {
  id: string
  content: string
  createdAt: number
  createdBy: User
}

export const ProjectMemberSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    avatar: { type: ["string", "null"] },
    role: { type: "string" },
    isOwner: { type: "boolean" }
  },
  required: ["id", "name", "role", "isOwner"],
  additionalProperties: false,
  example: {
    id: "user123",
    name: "John Doe",
    avatar: "https://example.com/avatar.png",
    role: "member",
    isOwner: false,
  }
} as const

export interface ProjectMember {
  id: string
  name: string
  avatar?: string | null
  role: string
  isOwner: boolean
}

export const ChecklistSchema = {
  type: "object",
  properties: {
    id: {
      type: "string",
      example: "2hek2bkjh"
    },
    text: {
      type: "string",
      example: "Checklist item"
    },
    checked: {
      type: "boolean",
      example: false
    },
    order: {
      type: "integer",
      minimum: 0,
      example: 1
    }
  },
  required: ["id", "text", "checked", "order"],
  additionalProperties: false
} as const

export interface Checklist {
  id: string
  text: string
  checked: boolean
  order: number
}

export const ProjectSchema = {
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 30,
      example: "2hek2bkjh"
    },
    name: {
      type: "string",
      example: "My Project"
    },
    company: {
      type: ["string", "null"],
      example: "Acme Corp"
    },
    logo: {
      type: ["string", "null"],
      example: "https://example.com/logo.png"
    },
    description: {
      type: ["string", "null"],
      example: "Project description"
    },
    progress: {
      type: "integer",
      example: 75
    },
    timeLeft: {
      type: "string",
      example: "2 weeks"
    },
    members: {
      type: "array",
      items: ProjectMemberSchema
    },
    orgId: {
      type: "string",
      example: "org123"
    },
    checklist: {
      type: "array",
      items: ChecklistSchema,
      default: []
    },
    acceptanceCriteria: {
      type: "array",
      items: ChecklistItemSchema,
      default: []
    },
    status: {
      enum: projectStatus,
      example: "started"
    },
    startDate: {
      type: "string",
      format: "date-time",
      example: "2025-01-01T00:00:00Z"
    },
    endDate: {
      type: "string",
      format: "date-time",
      example: "2025-01-01T00:00:00Z"
    },
    budget: {
      type: ["integer", "null"],
      example: 10000
    },
    createdAt: {
      type: "string",
      format: "date-time",
      example: "2025-01-01T00:00:00Z"
    },
    updatedAt: {
      type: "string",
      format: "date-time",
      example: "2025-01-01T00:00:00Z"
    },
    createdBy: UserSchema,
    updatedBy: UserSchema
  },
  required: [
    "id", "name", "progress", "timeLeft", "members", "orgId", 
    "status", "createdAt", "updatedAt", "createdBy", "updatedBy"
  ],
  additionalProperties: false
} as const

export interface Project {
  id: string
  name: string
  company?: string | null
  logo?: string | null
  description?: string | null
  progress: number
  timeLeft: string
  members: ProjectMember[]
  orgId: string
  checklist?: Checklist[]
  acceptanceCriteria?: ChecklistItem[]
  status: typeof projectStatus[number]
  startDate?: string
  endDate?: string
  budget?: number | null
  createdAt: string
  updatedAt: string
  createdBy: User
  updatedBy: User
}

export const RefUrlSchema = {
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
      example: "ref123"
    },
    url: {
      type: "string",
      format: "uri",
      maxLength: 1000,
      example: "https://example.com/figma"
    },
    title: {
      type: "string",
      maxLength: 255,
      example: "Figma Design"
    },
    type: {
      enum: ["figma", "task", "external"],
      example: "figma"
    },
    taskId: {
      type: "string",
      maxLength: 100,
      example: "task123"
    }
  },
  required: ["id", "url", "type"],
  additionalProperties: false,
  allOf: [
    {
      if: {
        properties: { type: { const: "task" } }
      },
      then: {
        required: ["taskId"]
      }
    }
  ],
  example: {
    id: "ref123",
    url: "https://example.com/figma",
    title: "Figma Design",
    type: "figma",
    taskId: "task123",
  }
} as const

export const LabelTagSchema = {
  type: "object",
  properties: {
    value: {
      type: "string",
      maxLength: 200,
      example: "high"
    },
    label: {
      type: "string",
      maxLength: 200,
      example: "High Priority"
    },
    color: {
      type: "string",
      maxLength: 100,
      example: "#ff0000"
    }
  },
  required: ["value", "label", "color"],
  additionalProperties: false,
  example: {
    value: "high",
    label: "High Priority",
    color: "#ff0000",
  }
} as const

export const AttachmentSchema = {
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
      example: "att123"
    },
    name: {
      type: "string",
      maxLength: 255,
      example: "document.pdf"
    },
    url: {
      type: "string",
      maxLength: 1000,
      example: "https://example.com/document.pdf"
    },
    size: {
      type: "string",
      maxLength: 50,
      example: "1.2MB"
    },
    type: {
      type: "string",
      maxLength: 100,
      example: "application/pdf"
    }
  },
  required: ["id", "name", "url", "size"],
  additionalProperties: false,
  example: {
    id: "att123",
    name: "document.pdf",
    url: "https://example.com/document.pdf",
    size: "1.2MB",
    type: "application/pdf",
  }
} as const

export const SubTaskSchema = {
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
      example: "subtask123"
    },
    name: {
      type: "string",
      maxLength: 300,
      example: "Subtask name"
    },
    completed: {
      type: "boolean",
      default: false,
      example: false
    },
    order: {
      type: "integer",
      minimum: 0,
      default: 0,
      example: 1
    }
  },
  required: ["id", "name"],
  additionalProperties: false,
  example: {
    id: "subtask123",
    name: "Subtask name",
    completed: false,
    order: 1,
  }
} as const

export const LabelSchema = {
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
      example: "label123"
    },
    projectId: {
      type: "string",
      maxLength: 100,
      example: "project123"
    },
    type: {
      enum: labelTypeEnum,
      example: "status"
    },
    name: {
      type: "string",
      maxLength: 200,
      example: "In Progress"
    },
    color: {
      type: "string",
      maxLength: 50,
      example: "#00ff00"
    },
    order: {
      type: "integer",
      minimum: 0,
      default: 0,
      example: 1
    },
    description: {
      type: "string",
      maxLength: 500,
      default: "",
      example: "Task is in progress"
    },
    createdAt: {
      type: "number",
      example: 1640995200000
    },
    updatedAt: {
      type: "number",
      example: 1640995200000
    },
    createdBy: UserSchema,
    updatedBy: UserSchema
  },
  required: [
    "id", "projectId", "type", "name", "color", 
    "createdAt", "updatedAt", "createdBy", "updatedBy"
  ],
  additionalProperties: false,
  example: {
    id: "label123",
    projectId: "project123",
    type: "status",
    name: "In Progress",
    color: "#00ff00",
    order: 1,
    description: "Task is in progress",
    createdAt: 1640995200000,
    updatedAt: 1640995200000,
    createdBy: {
      id: "user123",
      name: "John Doe",
      image: "https://example.com/avatar.png",
    },
    updatedBy: {
      id: "user123",
      name: "John Doe",
      image: "https://example.com/avatar.png",
    },
  }
} as const

export const TaskSchema = {
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
      example: "task123"
    },
    projectId: {
      type: "string",
      maxLength: 100,
      example: "project123"
    },
    name: {
      type: "string",
      maxLength: 500,
      example: "Task name"
    },
    statusId: {
      type: "string",
      maxLength: 100,
      example: "status123"
    },
    priorityId: {
      type: "string",
      maxLength: 100,
      example: "priority123"
    },
    parentTaskId: {
      type: ["string", "null"],
      maxLength: 100,
      default: null,
      example: null
    },
    isSubtask: {
      type: "boolean",
      default: false,
      example: false
    },
    taskOrder: {
      type: "integer",
      minimum: 0,
      default: 0,
      example: 1
    },
    startDate: {
      type: "number",
      example: 1640995200000
    },
    endDate: {
      type: "number",
      example: 1640995200000
    },
    description: {
      type: "string",
      maxLength: 2000,
      default: "",
      example: "Task description"
    },
    acceptanceCriteria: {
      type: "array",
      items: ChecklistItemSchema,
      default: []
    },
    checklist: {
      type: "array",
      items: ChecklistItemSchema,
      default: []
    },
    completed: {
      type: "boolean",
      default: false,
      example: false
    },
    refUrls: {
      type: "array",
      items: RefUrlSchema,
      default: []
    },
    labelsTags: {
      type: "array",
      items: LabelTagSchema,
      default: []
    },
    attachments: {
      type: "array",
      items: AttachmentSchema,
      default: []
    },
    assignedTo: {
      type: "array",
      items: UserSchema,
      default: []
    },
    createdAt: {
      type: "number",
      example: 1640995200000
    },
    updatedAt: {
      type: "number",
      example: 1640995200000
    },
    createdBy: UserSchema,
    updatedBy: UserSchema
  },
  required: [
    "id", "projectId", "name", "statusId", "priorityId",
    "createdAt", "updatedAt", "createdBy", "updatedBy"
  ],
  additionalProperties: false,
  example: {
    id: "task123",
    projectId: "project123",
    name: "Task name",
    statusId: "status123",
    priorityId: "priority123",
    parentTaskId: null,
    isSubtask: false,
    taskOrder: 1,
    startDate: 1640995200000,
    endDate: 1640995200000,
    description: "Task description",
    acceptanceCriteria: [],
    checklist: [],
    completed: false,
    refUrls: [],
    labelsTags: [],
    attachments: [],
    assignedTo: [],
    createdAt: 1640995200000,
    updatedAt: 1640995200000,
    createdBy: {
      id: "user123",
      name: "John Doe",
      image: "https://example.com/avatar.png",
    },
    updatedBy: {
      id: "user123",
      name: "John Doe",
      image: "https://example.com/avatar.png",
    },
  }
} as const

export interface Task {
  id: string
  projectId: string
  name: string
  statusId: string
  priorityId: string
  parentTaskId?: string | null
  isSubtask?: boolean
  taskOrder?: number
  startDate?: number
  endDate?: number
  description?: string
  acceptanceCriteria?: ChecklistItem[]
  checklist?: ChecklistItem[]
  completed?: boolean
  refUrls?: any[]
  labelsTags?: any[]
  attachments?: any[]
  assignedTo?: User[]
  createdAt: number
  updatedAt: number
  createdBy: User
  updatedBy: User
}

// Create validators
export const validateUser = ajv.compile(UserSchema)
export const validateChecklistItem = ajv.compile(ChecklistItemSchema)
export const validateComment = ajv.compile(CommentSchema)
export const validateProject = ajv.compile(ProjectSchema)
export const validateTask = ajv.compile(TaskSchema)
export const validateLabel = ajv.compile(LabelSchema)