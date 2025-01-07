import { z } from 'zod'

export const tweetSchema = z.object({
  timestamp: z.string(),
  text: z.string(),
  username: z.string(),
  userId: z.string(),
})

export const tweetDocumentSchema = z.object({
  tweetId: z.string(),
  createdAt: z.string(),
  text: z.string(),
  authorUsername: z.string(),
  authorId: z.string(),
  userId: z.string(),
  tags: z.array(z.string()),
  description: z.string(),
})
