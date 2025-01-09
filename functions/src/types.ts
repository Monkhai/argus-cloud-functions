export type UserMetadata = {
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
  type: ResourceType | ''
}

export type IndexEntryMetadata = ResourceData

export enum ResourceType {
  TWEET = 'tweet',
}
