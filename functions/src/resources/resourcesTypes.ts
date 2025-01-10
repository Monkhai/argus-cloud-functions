export type ResourceMetadata = {
  tags: string[]
  description: string
}

export const resourceType = ['tweet'] as const

export type TweetData = {
  authorUsername: string
  authorId: string
  text: string
}

export type ArticleData = {
  text: string
}

export type ResourceData = {
  type: ResourceType
  createdAt: string
  url: string
  resourceId: string
  tags: string[]
  description: string
  userId: string

  data: TweetData | ArticleData
}

export type ResourceContentForEmbedding = {
  text: string
  tags: string[]
  description: string

  authorUsername?: string
  authorId?: string
  createdAt?: string
  /*
  the empty string allows for the search query to embed the same json structure but without forcing the type field
  */
  type: ResourceType | ''
}

export type IndexEntryMetadata = Omit<ResourceData, 'data'> & {
  text: string
  authorUsername?: string
  authorId?: string
  createdAt?: string
}

export enum ResourceType {
  TWEET = 'tweet',
  ARTICLE = 'article',
}

export type CreateResourceDocumentRequest = {
  url: string
  userMetadata: ResourceMetadata
  type: ResourceType
}

export type CreateResourceDocumentResponse = {
  success: boolean
}
