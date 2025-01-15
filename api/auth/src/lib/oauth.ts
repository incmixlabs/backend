import type { Bindings } from "@/types"
import { Google } from "arctic"

type GoogleAuthOptions = {
  isTauri?: boolean
}

export function initializeGoogleAuth(
  { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URL }: Bindings,
  options: GoogleAuthOptions = {}
) {
  const baseUrl = GOOGLE_REDIRECT_URL
  const redirectUrl = options.isTauri
    ? `${baseUrl}/tauri-callback`
    : `${baseUrl}/callback`

  return new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUrl)
}
