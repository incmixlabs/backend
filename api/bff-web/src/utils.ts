import type { Context } from "./types"

export async function returnResponse(res: Response, c: Context) {
  const contentType = res.headers.get("content-type")
  const cookies = res.headers.get("set-cookie")

  if (cookies) {
    c.res.headers.set("set-cookie", cookies)
  }

  if (contentType?.includes("application/json")) {
    return c.json(await res.json())
  }

  if (contentType?.includes("text/html")) {
    return c.html(await res.text())
  }

  return c.text(await res.text())
}
