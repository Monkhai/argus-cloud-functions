import { z } from 'zod'
import { resourceType } from './types'

export type ParsedTweet = z.infer<typeof tweetSchema>

export const tweetSchema = z.object({
  timestamp: z.number(),
  text: z.string(),
  username: z.string(),
  userId: z.string(),
})

export const resourceDocumentSchema = z.object({
  type: z.enum(resourceType),
  resourceId: z.string(),
  createdAt: z.string(),
  text: z.string(),
  authorUsername: z.string(),
  authorId: z.string(),
  userId: z.string(),
  tags: z.array(z.string()),
  description: z.string(),
})
