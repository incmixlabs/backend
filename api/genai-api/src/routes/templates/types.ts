export interface StoryTemplate {
  id: number
  name: string
  content: string
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

export interface NewStoryTemplate {
  name: string
  content: string
}

export interface UpdateStoryTemplate {
  id?: number
  name?: string
  content?: string
  createdAt?: Date
  updatedAt?: Date
  createdBy?: string
}
