import { envVars } from "@/env-vars"
import type { Context } from "@/types"
import type { Organization } from "@incmix/utils/types"

export async function getOrganizationById(c: Context, id: string) {
  const url = `${envVars.ORG_URL}/id/${id}`

  const res = await fetch(url, {
    method: "get",
    headers: c.req.header(),
  })

  if (res.status !== 200 && res.status !== 404) {
    const data = (await res.json()) as { message: string }
    throw new Error(data.message)
  }

  if (res.status === 404) {
    return
  }

  return res.json()
}
