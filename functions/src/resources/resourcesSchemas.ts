import { z } from 'zod'
import { ResourceData, resourceType, ResourceMetadata, ArticleData, TweetData } from './resourcesTypes'

export type ParsedTweet = z.infer<typeof tweetSchema>

export const tweetSchema = z.object({
  timeParsed: z.date(),
  text: z.string(),
  username: z.string(),
  userId: z.string(),
})

export const articleSchema = z.object({
  text: z.string(),
})

export const tweetDataSchema = z.object({
  createdAt: z.string(),
  authorUsername: z.string(),
  authorId: z.string(),
  text: z.string(),
}) as z.ZodType<TweetData>

export const articleDataSchema = z.object({
  text: z.string(),
}) as z.ZodType<ArticleData>

export const resourceDocumentSchema = z.object({
  type: z.enum(resourceType),
  url: z.string(),
  resourceId: z.string(),
  tags: z.array(z.string()),
  description: z.string(),
  userId: z.string(),

  data: z.union([tweetDataSchema, articleDataSchema]),
}) as z.ZodType<ResourceData>

export const resourceMetadataSchema = z.object({
  tags: z.array(z.string()),
  description: z.string(),
}) as z.ZodType<ResourceMetadata>
