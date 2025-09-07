import type { FastifyReply } from "fastify"

export async function returnResponse(res: Response, reply: FastifyReply) {
  const contentType = res.headers.get("content-type")
  const cookies = res.headers.getSetCookie()
  const status = res.status

  cookies.forEach((cookie) => {
    reply.header("set-cookie", cookie)
  })

  if (contentType?.includes("application/json")) {
    return reply.status(status).send(await res.json())
  }

  if (contentType?.includes("text/html")) {
    reply.type("text/html")
    return reply.status(status).send(await res.text())
  }

  if (contentType?.includes("application/octet-stream")) {
    reply.type("application/octet-stream")
    const blob = await res.blob()
    const stream = blob.stream()

    return reply.status(status).send(stream)
  }

  return reply.status(status).send(await res.text())
}
