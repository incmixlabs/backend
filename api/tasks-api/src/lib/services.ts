import type { Context } from "@/types"
import type { Organization } from "@incmix/shared/types"

export async function getOrganizationById(c: Context, id: string) {
  const url = `${c.env.ORG_URL}/id/${id}`

  const res = await c.env.ORG.fetch(url, {
    method: "get",
    headers: c.req.header(),
  })

  if (res.status !== 200 && res.status !== 404) {
    const data = await res.json<{ message: string }>()
    throw new Error(data.message)
  }

  if (res.status === 404) {
    return
  }

  return res.json<Organization>()
}
