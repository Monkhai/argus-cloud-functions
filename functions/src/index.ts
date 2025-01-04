import { Pinecone } from '@pinecone-database/pinecone'
import { Scraper } from '@the-convocation/twitter-scraper'
import * as admin from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'
import * as functions from 'firebase-functions'
import { defineSecret } from 'firebase-functions/params'
import OpenAI from 'openai'

const pineconeApiKey = defineSecret('PINECONE_API_KEY')
const openaiApiKey = defineSecret('OPENAI_API_KEY')

admin.initializeApp()

type TweetData = {
  tweetId: string
  createdAt: string
  text: string
  authorUsername: string
  authorId: string
}

export const createTwitterDocument = functions.https.onCall<{ url: string }>(async (data, context) => {
  console.log('Creating Twitter document', data)
  const tweetId = data.data.url.split('/').pop()
  console.log('Tweet ID:', tweetId)
  if (!tweetId) {
    throw new functions.https.HttpsError('invalid-argument', 'No tweet ID found')
  }
  const scraper = new Scraper()
  const tweetData = await scraper.getTweet(tweetId)
  if (!tweetData) {
    throw new functions.https.HttpsError('invalid-argument', 'No tweet data found')
  }

  const document = {
    tweetId,
    createdAt: tweetData.timestamp,
    text: tweetData.text,
    authorUsername: tweetData.username,
    authorId: tweetData.userId,
  }

  const firestore = getFirestore()
  await firestore.collection('tweets').doc(tweetId).set(document)
  return { success: true }
})

export const onTweetCreated = functions.firestore.onDocumentCreated(
  {
    document: 'tweets/{tweetId}',
    secrets: [pineconeApiKey, openaiApiKey],
  },
  async event => {
    try {
      if (!event.data) {
        console.log('No tweet data found')
        return
      }
      const pinecone = new Pinecone({ apiKey: pineconeApiKey.value() })
      const openai = new OpenAI({
        apiKey: openaiApiKey.value(),
      })

      const tweetData = event.data.data() as TweetData

      const emb = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: tweetData.text,
      })

      const index = pinecone.index('tweets-vector-index')
      await index.upsert([
        {
          id: tweetData.tweetId,
          values: emb.data[0].embedding,
          metadata: {
            text: tweetData.text,
            authorUsername: tweetData.authorUsername,
            authorId: tweetData.authorId,
            createdAt: tweetData.createdAt,
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

export const searchTweets = functions.https.onCall<{ prompt: string }>(
  { secrets: [pineconeApiKey, openaiApiKey] },
  async (data, context) => {
    const prompt = data.data.prompt
    if (!prompt) {
      throw new functions.https.HttpsError('invalid-argument', 'No prompt found')
    }
    const openai = new OpenAI({
      apiKey: openaiApiKey.value(),
      dangerouslyAllowBrowser: true,
    })
    const pinecone = new Pinecone({ apiKey: pineconeApiKey.value() })
    const index = pinecone.index('tweets-vector-index')

    const embededPrompt = await openai.embeddings.create({
      input: prompt,
      model: 'text-embedding-ada-002',
    })

    const queryVector = embededPrompt.data[0].embedding
    const queryResponse = await index.query({
      topK: 10,
      includeMetadata: true,
      vector: queryVector,
    })

    return queryResponse
  }
)
