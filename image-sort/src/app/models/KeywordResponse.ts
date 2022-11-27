export interface KeywordResponse {
  keywords: Keyword[]
  status: string
}

export interface Keyword {
  keyword: string
  score: number
}