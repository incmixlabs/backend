import type {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from "kysely"

type StoryTemplatesTable = {
  id: Generated<number>
  name: string
  content: string
  createdAt: ColumnType<Date, string, never>
  updatedAt: ColumnType<Date, string, string>
  createdBy: string
}
export type StoryTemplate = Selectable<StoryTemplatesTable>
export type NewStoryTemplate = Insertable<StoryTemplatesTable>
export type UpdatedStoryTemplate = Updateable<StoryTemplatesTable>

export type GenAiTables = {
  storyTemplates: StoryTemplatesTable
}
