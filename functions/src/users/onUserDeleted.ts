import * as functions from 'firebase-functions/v1'
import { pineconeApiKey } from '../secrets'
import { error, log } from 'firebase-functions/logger'
import { Pinecone } from '@pinecone-database/pinecone'
import { getIndexId } from '../utils/getPineconeIndexId'
import { getFirestore } from 'firebase-admin/firestore'

export const onUserDeletedFn = functions
  .runWith({ secrets: [pineconeApiKey] })
  .auth.user()
  .onDelete(async event => {
    try {
      const pinecone = new Pinecone({ apiKey: pineconeApiKey.value() })
      await pinecone.deleteIndex(getIndexId(event.uid))
      log('Deleted pinecone index', { indexId: getIndexId(event.uid) })

      const firestore = getFirestore()
      await firestore.collection('users').doc(event.uid).delete()
      log('Deleted user document', { userId: event.uid })
    } catch (err) {
      error('onUserDeleted: ', err)
      throw err
    }
  })
