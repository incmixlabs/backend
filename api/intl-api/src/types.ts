import type { AuthUser as User } from "@incmix/utils/types"
import type { Context as HonoContext } from "hono"

export type Bindings = {
  COOKIE_NAME: string
  AUTH_URL: string
}

export type Variables = {
  user: User | null
}

export type HonoApp = { Bindings: Bindings; Variables: Variables }
export type Context = HonoContext<HonoApp>

export type LocaleRow = {
  id: number
  lang_code: string
  is_default: number
}
export const MessageTypes = ["frag", "label"] as const
export type MessageType = (typeof MessageTypes)[number]

export type IntlMessageRow = {
  id: number
  locale_id: number
  key: string
  value: string
  type: MessageType
  namespace: string
}
