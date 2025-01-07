import * as functions from 'firebase-functions'
import { TweetContentForEmbedding, TweetData, UserMetadata } from './types'
import { HttpsError } from 'firebase-functions/https'
import { Scraper } from '@the-convocation/twitter-scraper'
import { getFirestore } from 'firebase-admin/firestore'
import { tweetDocumentSchema, tweetSchema } from './schemas'
import { openaiApiKey, pineconeApiKey } from './secrets'
import { Pinecone } from '@pinecone-database/pinecone'
import OpenAI from 'openai'
import { getIndexId } from './utils'

type CreateTweetDocumentRequest = {
  url: string
  userMetadata: UserMetadata
}

type CreateTweetDocumentResponse = {
  success: boolean
}

export const createTweetDocumentFn = functions.https.onCall<CreateTweetDocumentRequest, Promise<CreateTweetDocumentResponse>>(
  async data => {
    if (!data.auth) {
      throw new HttpsError('permission-denied', 'User not authenticated')
    }

    const tweetId = data.data.url.split('/').pop()
    if (!tweetId) {
      throw new functions.https.HttpsError('invalid-argument', 'No tweet ID found')
    }
    const metadata = data.data.userMetadata as UserMetadata
    if (!metadata) {
      throw new functions.https.HttpsError('invalid-argument', 'No user metadata found')
    }
    const scraper = new Scraper()
    const tweetData = await scraper.getTweet(tweetId)
    if (!tweetData) {
      throw new functions.https.HttpsError('invalid-argument', 'No tweet data found')
    }

    const tweet = tweetSchema.parse(tweetData)

    const tweetDoc: TweetData = {
      tweetId,
      createdAt: new Date(tweet.timestamp).toISOString(),
      text: tweet.text,
      authorUsername: tweet.username,
      authorId: tweet.userId,
      userId: data.auth.uid,
      tags: metadata.tags,
      description: metadata.description,
    }

    const firestore = getFirestore()
    await firestore.collection('tweets').doc(tweetId).set(tweetDoc)
    return { success: true }
  }
)

export const onTweetCreatedFn = functions.firestore.onDocumentCreated(
  {
    document: 'tweets/{tweetId}',
    secrets: [pineconeApiKey, openaiApiKey],
  },
  async event => {
    try {
      if (!event.data) {
        console.error('No tweet data found. Empty document')
        return
      }
      const pinecone = new Pinecone({ apiKey: pineconeApiKey.value() })
      const openai = new OpenAI({
        apiKey: openaiApiKey.value(),
      })

      const tweetData = event.data.data() as TweetData
      const tweetDocument = tweetDocumentSchema.parse(tweetData)

      const tweetContentForEmbedding: TweetContentForEmbedding = {
        text: tweetDocument.text,
        description: tweetDocument.description,
        authorUsername: tweetDocument.authorUsername,
        authorId: tweetDocument.authorId,
        createdAt: tweetDocument.createdAt,
        tags: tweetDocument.tags,
      }

      const embedding = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: JSON.stringify(tweetContentForEmbedding, Object.keys(tweetContentForEmbedding).sort()),
      })

      const indexId = getIndexId(tweetDocument.userId)
      const index = pinecone.index(indexId)

      await index.upsert([
        {
          id: tweetDocument.tweetId,
          values: embedding.data[0].embedding,
          metadata: {
            text: tweetDocument.text,
            authorUsername: tweetDocument.authorUsername,
            authorId: tweetDocument.authorId,
            createdAt: tweetDocument.createdAt,
            tags: tweetDocument.tags,
            description: tweetDocument.description,
          },
        },
      ])

      console.log('Tweet created and indexed')
    } catch (error) {
      console.error('Error creating tweet and indexing', error)
      throw error
    }
  }
)
