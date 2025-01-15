export const defaultHeaders = {
  "content-type": "application/json",
  origin: "http://localhost:1420",
  "accept-language": "en",
}

type Task = {
  task: string
  userId: string
  completed: boolean
}

export const insertTask = async (
  db: D1Database,
  { task, userId, completed = false }: Task
) => {
  const complete = completed ? 1 : 0
  return await db
    .prepare(
      "insert into tasks (task, completed, user_id) values (?, ?, ?) returning *"
    )
    .bind(task, complete, userId)
    .run()
}
