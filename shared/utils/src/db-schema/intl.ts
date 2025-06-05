import type {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from "kysely"

type LocaleTable = {
  id: Generated<number>
  code: string
  isDefault: boolean | null
  createdAt: ColumnType<Date, null, string>
  updatedAt: ColumnType<Date, null, string>
}

export const TranslationTypes = ["frag", "label"] as const
export type TranslationType = (typeof TranslationTypes)[number]

type TranslationsTable = {
  id: Generated<number>
  localeId: number
  key: string
  value: string
  type: TranslationType
  namespace: string
  createdAt: ColumnType<Date, null, string>
  updatedAt: ColumnType<Date, null, string>
}

export type Message = Selectable<TranslationsTable>
export type NewMessage = Insertable<TranslationsTable>
export type UpdatedMessage = Updateable<TranslationsTable>

export type Locale = Selectable<LocaleTable>
export type NewLocale = Insertable<LocaleTable>
export type UpdatedLocale = Updateable<LocaleTable>

export type IntlTables = {
  translations: TranslationsTable
  locales: LocaleTable
}

export type TranslationColumn = keyof (TranslationsTable & {
  locale: string
})

export const translationColumns: TranslationColumn[] = [
  "id",
  "locale",
  "key",
  "value",
  "type",
  "namespace",
] as const
