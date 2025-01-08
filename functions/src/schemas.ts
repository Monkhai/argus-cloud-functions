import { z } from 'zod'
import { ResourceData, resourceType } from './types'

export type ParsedTweet = z.infer<typeof tweetSchema>

export const tweetSchema = z.object({
  timestamp: z.number(),
  text: z.string(),
  username: z.string(),
  userId: z.string(),
})

export const resourceDocumentSchema = z.object({
  link: z.string(),
  type: z.enum(resourceType),
  resourceId: z.string(),
  createdAt: z.string(),
  text: z.string(),
  authorUsername: z.string(),
  authorId: z.string(),
  userId: z.string(),
  tags: z.array(z.string()),
  description: z.string(),
}) as z.ZodType<ResourceData>
