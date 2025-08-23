import type { Task } from "@incmix-api/utils/db-schema"
import { nanoid } from "nanoid"

export const mockTasks: Task[] = [
  {
    id: "mock-task-1",
    name: "Implement user authentication",
    description: "Add OAuth2 authentication with Google and GitHub providers",
    taskOrder: 1,
    projectId: "mock-project-1",
    statusId: "status-todo",
    priorityId: "priority-high",
    parentTaskId: null,
    labelsTags: [
      { value: "backend", label: "Backend", color: "#0066CC" },
      { value: "security", label: "Security", color: "#FF6B6B" },
      { value: "auth", label: "Authentication", color: "#4ECDC4" },
    ],
    refUrls: [
      {
        id: "ref-1",
        type: "external",
        url: "https://github.com/example/auth-implementation",
        title: "Auth Implementation",
      },
      {
        id: "ref-2",
        type: "figma",
        url: "https://figma.com/file/example/auth-flow",
        title: "Auth Flow Design",
      },
    ],
    attachments: [],
    acceptanceCriteria: [
      {
        id: "ac-1",
        text: "Users can sign in with Google",
        checked: false,
        order: 1,
      },
      {
        id: "ac-2",
        text: "Users can sign in with GitHub",
        checked: false,
        order: 2,
      },
      {
        id: "ac-3",
        text: "Session management is implemented",
        checked: false,
        order: 3,
      },
      {
        id: "ac-4",
        text: "Refresh tokens are handled properly",
        checked: false,
        order: 4,
      },
    ],
    startDate: new Date("2025-01-15"),
    endDate: new Date("2025-01-25"),
    createdBy: "user-1",
    updatedBy: "user-1",
    createdAt: new Date("2025-01-10"),
    updatedAt: new Date("2025-01-10"),
    completed: false,
    checklist: [
      {
        id: "check-1",
        text: "Setup OAuth providers",
        checked: true,
        order: 1,
      },
      {
        id: "check-2",
        text: "Implement login endpoints",
        checked: false,
        order: 2,
      },
      {
        id: "check-3",
        text: "Add session middleware",
        checked: false,
        order: 3,
      },
      { id: "check-4", text: "Write tests", checked: false, order: 4 },
    ],
  },
  {
    id: "mock-task-2",
    name: "Design dashboard UI",
    description: "Create responsive dashboard with analytics widgets",
    taskOrder: 2,
    projectId: "mock-project-1",
    statusId: "status-in-progress",
    priorityId: "priority-medium",
    parentTaskId: null,
    labelsTags: [
      { value: "frontend", label: "Frontend", color: "#45B7D1" },
      { value: "ui", label: "UI", color: "#96CEB4" },
      { value: "design", label: "Design", color: "#FECA57" },
    ],
    refUrls: [
      {
        id: "ref-3",
        type: "figma",
        url: "https://figma.com/file/example/dashboard-design",
        title: "Dashboard Design",
      },
    ],
    attachments: [
      {
        id: "att-1",
        name: "dashboard-mockup.png",
        url: "/uploads/dashboard-mockup.png",
        size: "2.5MB",
        type: "image/png",
      },
      {
        id: "att-2",
        name: "widget-components.sketch",
        url: "/uploads/widget-components.sketch",
        size: "1.8MB",
        type: "application/sketch",
      },
    ],
    acceptanceCriteria: [
      {
        id: "ac-5",
        text: "Dashboard is responsive on mobile, tablet, and desktop",
        checked: false,
        order: 1,
      },
      {
        id: "ac-6",
        text: "Analytics widgets display real-time data",
        checked: false,
        order: 2,
      },
      { id: "ac-7", text: "Dark mode is supported", checked: false, order: 3 },
      {
        id: "ac-8",
        text: "Loading states are implemented",
        checked: false,
        order: 4,
      },
    ],
    startDate: new Date("2025-01-20"),
    endDate: new Date("2025-02-05"),
    createdBy: "user-2",
    updatedBy: "user-2",
    createdAt: new Date("2025-01-12"),
    updatedAt: new Date("2025-01-18"),
    completed: false,
    checklist: [
      { id: "check-5", text: "Create wireframes", checked: true, order: 1 },
      { id: "check-6", text: "Design components", checked: true, order: 2 },
      {
        id: "check-7",
        text: "Implement responsive layout",
        checked: false,
        order: 3,
      },
    ],
  },
  {
    id: "mock-task-3",
    name: "API rate limiting",
    description: "Implement rate limiting for all API endpoints",
    taskOrder: 3,
    projectId: "mock-project-2",
    statusId: "status-done",
    priorityId: "priority-low",
    parentTaskId: null,
    labelsTags: [
      { value: "backend", label: "Backend", color: "#0066CC" },
      { value: "performance", label: "Performance", color: "#26DE81" },
      { value: "security", label: "Security", color: "#FF6B6B" },
    ],
    refUrls: [],
    attachments: [],
    acceptanceCriteria: [
      {
        id: "ac-9",
        text: "Rate limits are configurable per endpoint",
        checked: true,
        order: 1,
      },
      {
        id: "ac-10",
        text: "Redis is used for distributed rate limiting",
        checked: true,
        order: 2,
      },
      {
        id: "ac-11",
        text: "Clear error messages for rate limit exceeded",
        checked: true,
        order: 3,
      },
    ],
    startDate: new Date("2025-01-05"),
    endDate: new Date("2025-01-10"),
    createdBy: "user-1",
    updatedBy: "user-3",
    createdAt: new Date("2025-01-04"),
    updatedAt: new Date("2025-01-10"),
    completed: true,
    checklist: [],
  },
]

export const mockProjects = [
  {
    id: "mock-project-1",
    name: "E-commerce Platform",
    description: "Modern e-commerce platform with AI recommendations",
  },
  {
    id: "mock-project-2",
    name: "API Infrastructure",
    description: "Core API infrastructure improvements",
  },
]

export const mockLabels = [
  { id: "status-todo", name: "To Do", type: "status", color: "#808080" },
  {
    id: "status-in-progress",
    name: "In Progress",
    type: "status",
    color: "#0066CC",
  },
  { id: "status-done", name: "Done", type: "status", color: "#00AA00" },
  { id: "priority-low", name: "Low", type: "priority", color: "#00AA00" },
  { id: "priority-medium", name: "Medium", type: "priority", color: "#FFA500" },
  { id: "priority-high", name: "High", type: "priority", color: "#FF0000" },
]

export const mockTaskAssignments = [
  { taskId: "mock-task-1", userId: "user-2" },
  { taskId: "mock-task-1", userId: "user-3" },
  { taskId: "mock-task-2", userId: "user-1" },
  { taskId: "mock-task-3", userId: "user-1" },
]

export const mockUsers = [
  {
    id: "user-1",
    name: "Alice Johnson",
    email: "alice@example.com",
    avatar: "https://i.pravatar.cc/150?img=1",
  },
  {
    id: "user-2",
    name: "Bob Smith",
    email: "bob@example.com",
    avatar: "https://i.pravatar.cc/150?img=2",
  },
  {
    id: "user-3",
    name: "Charlie Brown",
    email: "charlie@example.com",
    avatar: "https://i.pravatar.cc/150?img=3",
  },
]

export function generateMockTask(data?: Partial<Task>): Task {
  const id = data?.id || `mock-${nanoid(7)}`
  const now = new Date()

  return {
    id,
    name: data?.name || "Mock Task",
    description: data?.description || "This is a mock task for testing",
    taskOrder: data?.taskOrder || 1,
    projectId: data?.projectId || "mock-project-1",
    statusId: data?.statusId || "status-todo",
    priorityId: data?.priorityId || "priority-medium",
    parentTaskId: data?.parentTaskId || null,
    labelsTags: data?.labelsTags || [
      { value: "mock", label: "Mock", color: "#A3A3A3" },
      { value: "test", label: "Test", color: "#6C5CE7" },
    ],
    refUrls: data?.refUrls || [],
    attachments: data?.attachments || [],
    acceptanceCriteria: data?.acceptanceCriteria || [
      {
        id: "ac-mock",
        text: "Mock acceptance criteria",
        checked: false,
        order: 1,
      },
    ],
    startDate: data?.startDate || now,
    endDate: data?.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdBy: data?.createdBy || "user-1",
    updatedBy: data?.updatedBy || "user-1",
    createdAt: data?.createdAt || now,
    updatedAt: data?.updatedAt || now,
    completed: data?.completed || false,
    checklist: data?.checklist || [],
  }
}

export function getMockTaskWithAssignments(taskId: string) {
  const task = mockTasks.find((t) => t.id === taskId)
  if (!task) return null

  const assignments = mockTaskAssignments
    .filter((a) => a.taskId === taskId)
    .map((a) => {
      const user = mockUsers.find((u) => u.id === a.userId)
      return user
    })
    .filter(Boolean)

  return {
    ...task,
    assignedTo: assignments,
    comments: [],
  }
}

export function getAllMockTasksWithAssignments() {
  return mockTasks
    .map((task) => getMockTaskWithAssignments(task.id))
    .filter(Boolean)
}
