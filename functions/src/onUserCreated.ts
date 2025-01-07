import { Pinecone } from '@pinecone-database/pinecone'
import * as functions from 'firebase-functions/v1'
import { pineconeApiKey } from './secrets'
import { DIMENSIONS, METRIC } from './constants'

export const onUserCreatedFn = functions
  .runWith({ secrets: [pineconeApiKey] })
  .auth.user()
  .onCreate(async event => {
    const pinecone = new Pinecone({ apiKey: pineconeApiKey.value() })
    await pinecone.createIndex({ name: event.uid, dimension: DIMENSIONS, metric: METRIC, spec: {} })
    console.log(`Index created for user ${event.uid}`)
  })
