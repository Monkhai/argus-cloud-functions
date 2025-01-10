export type ResourceMetadata = {
  tags: string[]
  description: string
}

export const resourceType = ['tweet'] as const

export type ResourceData = {
  type: ResourceType
  resourceId: string
  createdAt: string
  text: string
  authorUsername: string
  authorId: string
  tags: string[]
  description: string
  userId: string
  url: string
}

export type ResourceContentForEmbedding = {
  text: string
  tags: string[]
  description: string
  authorUsername: string
  authorId: string
  createdAt: string
  /*
  the empty string allows for the search query to embed the same json structure but without forcing the type field
  */
  type: ResourceType | ''
}

export type IndexEntryMetadata = ResourceData

export enum ResourceType {
  TWEET = 'tweet',
}

export type CreateResourceDocumentRequest = {
  url: string
  userMetadata: ResourceMetadata
  type: ResourceType
}

export type CreateResourceDocumentResponse = {
  success: boolean
}
