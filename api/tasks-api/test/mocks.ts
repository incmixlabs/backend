import {
  type Miniflare,
  type Request,
  type RequestInitCfType,
  Response,
} from "miniflare"

export const authService = async (
  req: Request<RequestInitCfType>,
  mf: Miniflare
) => {
  await mf.ready

  const sessionId = req.headers.get("cookie")?.split("=")[1]
  if (!sessionId)
    return Response.json({ message: "Unauthorized" }, { status: 401 })
  if (sessionId === "user_1")
    return Response.json(
      {
        email: "user1@example.com",
        emailVerified: true,
        id: "user_1",
      },
      { status: 200 }
    )
  if (sessionId === "user_2")
    return Response.json(
      {
        email: "user2@example.com",
        emailVerified: true,
        id: "user_2",
      },
      { status: 200 }
    )

  return Response.json({ message: "Unauthorized" }, { status: 401 })
}

export const orgService = async (
  req: Request<RequestInitCfType>,
  mf: Miniflare
) => {
  await mf.ready

  const sessionId = req.headers.get("cookie")?.split("=")[1]
  if (!sessionId)
    return Response.json({ message: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  if (url.pathname.endsWith("/id/12345"))
    return Response.json(
      {
        handle: "tets-organisation",
        id: "12345",
        members: [
          {
            orgId: "12345",
            role: "owner",
            userId: "user_1",
          },
        ],
        name: "Test organisation",
      },
      { status: 200 }
    )

  return Response.json({ message: "Org not found" }, { status: 404 })
}

export const intlService = async (
  req: Request<RequestInitCfType>,
  mf: Miniflare
) => {
  await mf.ready
  const url = new URL(req.url)
  if (url.pathname.endsWith("locales/default"))
    return Response.json({ code: "en", is_default: true }, { status: 200 })

  return Response.json(defaultMessages, { status: 200 })
}

export const defaultMessages = [
  {
    key: "errors.server_error",
    value: "errors.server_error",
    type: "label",
    locale: "en",
  },
  {
    key: "errors.unauthorized",
    value: "errors.unauthorized",
    type: "label",
    locale: "en",
  },
  {
    key: "errors.server_error",
    value: "errors.server_error",
    type: "label",
    locale: "en",
  },
  {
    key: "errors.bad_request",
    value: "errors.bad_request",
    type: "label",
    locale: "en",
  },
  {
    key: "errors.task_insert_fail",
    value: "errors.task_insert_fail",
    type: "label",
    locale: "en",
  },
  {
    key: "errors.task_update_fail",
    value: "errors.task_update_fail",
    type: "label",
    locale: "en",
  },
  {
    key: "errors.task_delete_fail",
    value: "errors.task_delete_fail",
    type: "label",
    locale: "en",
  },
  {
    key: "errors.task_not_found",
    value: "errors.task_not_found",
    type: "label",
    locale: "en",
  },
]
