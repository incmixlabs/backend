import { envVars } from "@/env-vars"
import type { MessageResponse } from "@/routes/types"
import type { Context } from "@/types"
import { generateSentryHeaders } from "@incmix-api/utils"
import { BadRequestError, ServerError } from "@incmix-api/utils/errors"
import type { UserProfile } from "@incmix/utils/types"

export async function getUserProfile(c: Context, id: string, cookie: string) {
  const sentryHeaders = generateSentryHeaders(c)
  const res = await c.env.USERS_API.fetch(`${c.env.USERS_API_URL}?id=${id}`, {
    method: "GET",
    headers: {
      "content-type": "application/json",
      cookie,
      ...sentryHeaders,
    },
  })

  if (!res.ok) {
    const error = await res.json<MessageResponse>()
    if (res.status >= 500) throw new ServerError(error.message)
    throw new BadRequestError(error.message)
  }
  return await res.json<UserProfile>()
}
export async function createUserProfile(
  c: Context,
  id: string,
  fullName: string,
  email: string,
  localeId: number
) {
  const sentryHeaders = generateSentryHeaders(c)
  const res = await fetch(`${envVars.USERS_API_URL}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: c.req.header("cookie") ?? "",
      ...sentryHeaders,
    },
    body: JSON.stringify({
      id,
      email,
      fullName,
      localeId,
    }),
  })

  if (!res.ok) {
    const error = await res.json<MessageResponse>()
    if (res.status >= 500) throw new ServerError(error.message)
    throw new BadRequestError(error.message)
  }
  return await res.json<UserProfile>()
}
export async function deleteUserProfile(c: Context, id: string) {
  const sentryHeaders = generateSentryHeaders(c)
  const res = await fetch(`${envVars.USERS_API_URL}/${id}`, {
    method: "delete",
    headers: {
      "content-type": "application/json",
      cookie: c.req.header("cookie") ?? "",
      ...sentryHeaders,
    },
  })

  if (!res.ok) {
    const error = await res.json<MessageResponse>()
    if (res.status >= 500) throw new ServerError(error.message)
    throw new BadRequestError()
  }
  return await res.json<MessageResponse>()
}
