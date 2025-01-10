import { Pinecone } from '@pinecone-database/pinecone'
import { getFirestore } from 'firebase-admin/firestore'
import { error, log } from 'firebase-functions/logger'
import * as functions from 'firebase-functions/v1'
import { DIMENSIONS, METRIC } from '../constants'
import { pineconeApiKey } from '../secrets'
import { getIndexId } from '../utils/getPineconeIndexId'

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
      log('Index created', { indexId: getIndexId(event.uid) })

      log('Creating user document', { userId: event.uid })
      const firestore = getFirestore()
      await firestore
        .collection('users')
        .doc(event.uid)
        .set({
          indexId: getIndexId(event.uid),
        })
      log('User document created', { userId: event.uid })
    } catch (err) {
      error('onUserCreated: ', err, 'userId: ', event.uid)
    }
  })
