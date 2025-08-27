import { Google } from "arctic"
import { env } from "hono/adapter"
import type { Context } from "@/types"

type GoogleAuthOptions = {
  isTauri?: boolean
}

export function initializeGoogleAuth(
  c: Context,
  options: GoogleAuthOptions = {}
) {
  const baseUrl = env(c).GOOGLE_REDIRECT_URL
  const redirectUrl = options.isTauri
    ? `${baseUrl}/tauri-callback`
    : `${baseUrl}/callback`

  return new Google(
    env(c).GOOGLE_CLIENT_ID,
    env(c).GOOGLE_CLIENT_SECRET,
    redirectUrl
  )
}
