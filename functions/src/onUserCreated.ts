import { Pinecone } from '@pinecone-database/pinecone'
import * as functions from 'firebase-functions/v1'
import { pineconeApiKey } from './secrets'
import { DIMENSIONS, METRIC } from './constants'
import { log, error } from 'firebase-functions/logger'
import { getIndexId } from './utils'

export const onUserCreatedFn = functions
  .runWith({ secrets: [pineconeApiKey] })
  .auth.user()
  .onCreate(async event => {
    try {
      log('Creating index for user', getIndexId(event.uid))
      const pinecone = new Pinecone({ apiKey: pineconeApiKey.value() })
      await pinecone.createIndex({
        name: getIndexId(event.uid),
        dimension: DIMENSIONS,
        metric: METRIC,
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
      })
    } catch (err) {
      error('Error creating index', err, event.uid)
    }
  })
