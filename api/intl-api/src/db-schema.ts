import type { Generated, Insertable, Selectable, Updateable } from "kysely"

type LocaleTable = {
  id: Generated<number>
  langCode: string
  isDefault: boolean | null
}

export const MessageTypes = ["frag", "label"] as const
export type MessageType = (typeof MessageTypes)[number]

type MessageTable = {
  id: Generated<number>
  localeId: number
  key: string
  value: string
  type: MessageType
  namespace: string
}

export type Database = {
  translations: MessageTable
  locales: LocaleTable
}

export type Message = Selectable<MessageTable>
export type NewMessage = Insertable<MessageTable>
export type UpdatedMessage = Updateable<MessageTable>

export type Locale = Selectable<LocaleTable>
export type NewLocale = Insertable<LocaleTable>
export type UpdatedLocale = Updateable<LocaleTable>

export type MessageColumn = keyof (MessageTable & {
  locale: string
})

export const columns: MessageColumn[] = [
  "id",
  "locale",
  "key",
  "value",
  "type",
  "namespace",
] as const
