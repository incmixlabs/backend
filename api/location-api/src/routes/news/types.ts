// TODO: Implement news types
// These are placeholder types that need proper implementation

export type NewsApiResponse = {
  news_results: Array<{
    title: string
    url: string
    description?: string
  }>
}

export type NewsResponse = Array<{
  position: number
  highlight: any
  stories: any
}>

export type TopicApiResponse = {
  topics: string[]
}
