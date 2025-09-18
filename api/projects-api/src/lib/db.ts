import type { NewTask, UpdatedTask } from "@incmix-api/utils/db-schema"
import { nanoid } from "nanoid"
import type { Context } from "../types"

type ChecklistItem = {
  id: string
  text: string
  checked?: boolean
  order?: number
}

export async function addTaskChecklistItem(
  c: Context,
  taskId: string,
  item: Omit<ChecklistItem, "id">
) {
  const task = await c.db
    .selectFrom("tasks")
    .select("checklist")
    .where("id", "=", taskId)
    .executeTakeFirst()

  if (!task) {
    throw new Error("Task not found")
  }

  const newItem: ChecklistItem = {
    id: nanoid(),
    text: item.text,
    checked: item.checked || false,
    order: item.order || task.checklist?.length || 0,
  }

  const updatedChecklist = [...(task.checklist || []), newItem]

  await c.db
    .updateTable("tasks")
    .set({
      checklist: JSON.stringify(updatedChecklist),
      updatedAt: new Date().toISOString(),
      updatedBy: c.user?.id || "system",
    })
    .where("id", "=", taskId)
    .execute()

  return { taskId, message: "Item added", item: newItem }
}

export async function createTask(c: Context, userId: string, task: NewTask) {
  const newTask: NewTask = {
    ...task,
    id: nanoid(),
    checklist: JSON.stringify(task.checklist || []),
    acceptanceCriteria: JSON.stringify(task.acceptanceCriteria || []),
    refUrls: JSON.stringify(task.refUrls || []),
    labelsTags: JSON.stringify(task.labelsTags || []),
    attachments: JSON.stringify(task.attachments || []),
    completed: task.completed || false,
    taskOrder: task.taskOrder || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: userId,
    updatedBy: userId,
  }

  const result = await c.db
    .insertInto("tasks")
    .values(newTask)
    .returning(["id", "name"])
    .executeTakeFirst()

  if (!result) {
    throw new Error("Failed to create task")
  }

  return { taskId: result.id, name: result.name, message: "Task created" }
}

export async function deleteTask(c: Context, taskId: string) {
  const result = await c.db
    .deleteFrom("tasks")
    .where("id", "=", taskId)
    .executeTakeFirst()

  if (result.numDeletedRows === 0n) {
    throw new Error("Task not found or already deleted")
  }

  await c.db
    .deleteFrom("taskAssignments")
    .where("taskId", "=", taskId)
    .execute()

  return { message: "Task deleted" }
}

export async function getTaskById(c: Context, taskId: string) {
  const task = await c.db
    .selectFrom("tasks")
    .selectAll()
    .where("id", "=", taskId)
    .executeTakeFirst()

  if (!task) {
    throw new Error("Task not found")
  }

  return task
}

export async function getTasks(c: Context, userId: string) {
  const tasks = await c.db
    .selectFrom("tasks as t")
    .leftJoin("projectMembers as pm", "pm.projectId", "t.projectId")
    .selectAll("t")
    .where("pm.userId", "=", userId)
    .orderBy("t.taskOrder", "asc")
    .orderBy("t.createdAt", "desc")
    .execute()

  return tasks
}

export async function removeTaskChecklistItems(
  c: Context,
  taskId: string,
  itemIds: string[]
) {
  const task = await c.db
    .selectFrom("tasks")
    .select("checklist")
    .where("id", "=", taskId)
    .executeTakeFirst()

  if (!task) {
    throw new Error("Task not found")
  }

  const updatedChecklist = (task.checklist || []).filter(
    (item) => !itemIds.includes(item.id)
  )

  await c.db
    .updateTable("tasks")
    .set({
      checklist: JSON.stringify(updatedChecklist),
      updatedAt: new Date().toISOString(),
      updatedBy: c.user?.id || "system",
    })
    .where("id", "=", taskId)
    .execute()

  return {
    message: "Items removed",
    removedCount: (task.checklist?.length || 0) - updatedChecklist.length,
  }
}

export async function updateTask(
  c: Context,
  taskId: string,
  userId: string,
  updates: UpdatedTask
) {
  const result = await c.db
    .updateTable("tasks")
    .set({
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    })
    .where("id", "=", taskId)
    .executeTakeFirst()

  if (result.numUpdatedRows === 0n) {
    throw new Error("Task not found or no changes made")
  }

  return { message: "Task updated" }
}

export async function updateTaskChecklistItem(
  c: Context,
  taskId: string,
  itemId: string,
  updates: Partial<ChecklistItem>
) {
  const task = await c.db
    .selectFrom("tasks")
    .select("checklist")
    .where("id", "=", taskId)
    .executeTakeFirst()

  if (!task) {
    throw new Error("Task not found")
  }

  const updatedChecklist = (task.checklist || []).map((item) =>
    item.id === itemId ? { ...item, ...updates } : item
  )

  const updatedItem = updatedChecklist.find((item) => item.id === itemId)

  if (!updatedItem) {
    throw new Error("Checklist item not found")
  }

  await c.db
    .updateTable("tasks")
    .set({
      checklist: JSON.stringify(updatedChecklist),
      updatedAt: new Date().toISOString(),
      updatedBy: c.user?.id || "system",
    })
    .where("id", "=", taskId)
    .execute()

  return { message: "Item updated", item: updatedItem }
}
