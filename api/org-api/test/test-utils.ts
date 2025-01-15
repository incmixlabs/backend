export const defaultHeaders = {
  "content-type": "application/json",
  origin: "http://localhost:1420",
  "accept-language": "en",
}

type OrgRow = {
  id: string
  name: string
  handle: string
  ownerId: string
}

export const insertOrganisation = async (
  db: D1Database,
  { id, name, handle, ownerId }: OrgRow
) => {
  await db.batch([
    db
      .prepare("insert into organisations (id, name,handle) values (?, ?,?)")
      .bind(id, name, handle),
    db
      .prepare(
        "insert into members (user_id, org_id, role_id) values (?, ?, ?)"
      )
      .bind(ownerId, id, 2),
  ])
}
