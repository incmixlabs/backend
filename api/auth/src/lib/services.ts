import type { MessageResponse } from "@/routes/types"
import type { Context } from "@/types"
import { generateSentryHeaders } from "@incmix-api/utils"
import { BadRequestError, ServerError } from "@incmix-api/utils/errors"
import type { UserProfile } from "@incmix/utils/types"
import { env } from "hono/adapter"

export async function getUserProfile(c: Context, id: string, cookie: string) {
  const res = await fetch(`${env(c).USERS_API_URL}?id=${id}`, {
    method: "GET",
    headers: {
      "content-type": "application/json",
      cookie,
      ...generateSentryHeaders(c),
    },
  })

  if (!res.ok) {
    const error = (await res.json()) as MessageResponse
    if (res.status >= 500) throw new ServerError(error.message)
    throw new BadRequestError(error.message)
  }
  return (await res.json()) as UserProfile
}
export async function createUserProfile(
  c: Context,
  id: string,
  fullName: string,
  email: string,
  localeId: number
) {
  const res = await fetch(`${env(c).USERS_API_URL}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: c.req.header("cookie") ?? "",
      ...generateSentryHeaders(c),
    },
    body: JSON.stringify({
      id,
      email,
      name: fullName,
      localeId,
    }),
  })

  if (!res.ok) {
    const error = (await res.json()) as MessageResponse
    if (res.status >= 500) throw new ServerError(error.message)
    throw new BadRequestError(error.message)
  }
  return (await res.json()) as UserProfile
}
export async function deleteUserProfile(c: Context, id: string) {
  const res = await fetch(`${env(c).USERS_API_URL}/${id}`, {
    method: "delete",
    headers: {
      "content-type": "application/json",
      cookie: c.req.header("cookie") ?? "",
      ...generateSentryHeaders(c),
    },
  })

  if (!res.ok) {
    const error = (await res.json()) as MessageResponse
    if (res.status >= 500) throw new ServerError(error.message)
    throw new BadRequestError()
  }
  return (await res.json()) as MessageResponse
}
