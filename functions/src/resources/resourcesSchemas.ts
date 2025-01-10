import { z } from 'zod'
import { ResourceData, resourceType, ResourceMetadata } from './resourcesTypes'

export type ParsedTweet = z.infer<typeof tweetSchema>

export const tweetSchema = z.object({
  timeParsed: z.date(),
  text: z.string(),
  username: z.string(),
  userId: z.string(),
})

export const resourceDocumentSchema = z.object({
  url: z.string(),
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

export const resourceMetadataSchema = z.object({
  tags: z.array(z.string()),
  description: z.string(),
}) as z.ZodType<ResourceMetadata>
