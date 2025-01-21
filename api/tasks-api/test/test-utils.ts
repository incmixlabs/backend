import type { NewColumn, NewProject, NewTask } from "@/dbSchema"

export const defaultHeaders = {
  "content-type": "application/json",
  origin: "http://localhost:1420",
  "accept-language": "en",
}

export const insertTask = async (
  db: D1Database,
  {
    id,
    columnId,
    projectId,
    content,
    taskOrder,
    assignedTo,
    createdBy,
    updatedBy,
    status,
  }: NewTask
) => {
  return await db
    .prepare(
      "insert into tasks (id, column_id, project_id, content, task_order, assigned_to, created_by, updated_by, status) values (?, ?, ?, ?, ?, ?, ?, ?, ?) returning *"
    )
    .bind(
      id,
      columnId,
      projectId,
      content,
      taskOrder,
      assignedTo,
      createdBy,
      updatedBy,
      status
    )
    .run()
}
export const insertProject = async (
  db: D1Database,
  { id, orgId, name, createdBy, updatedBy }: NewProject
) => {
  return await db
    .prepare(
      "insert into projects (id, org_id, name, created_by, updated_by) values (?, ?, ?, ?, ?) returning *"
    )
    .bind(id, orgId, name, createdBy, updatedBy)
    .run()
}

export const insertColumn = async (
  db: D1Database,
  { id, label, projectId, columnOrder, createdBy, updatedBy }: NewColumn
) => {
  return await db
    .prepare(
      "insert into columns (id, project_id, label, column_order, created_by, updated_by) values (?, ?, ?, ?, ?, ?) returning *"
    )
    .bind(id, projectId, label, columnOrder, createdBy, updatedBy)
    .run()
}
