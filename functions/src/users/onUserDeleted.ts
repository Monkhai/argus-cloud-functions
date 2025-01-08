import * as functions from 'firebase-functions/v1'
import { pineconeApiKey } from '../secrets'
import { error, log } from 'firebase-functions/logger'
import { Pinecone } from '@pinecone-database/pinecone'
import { getIndexId } from '../utils'
import { getFirestore } from 'firebase-admin/firestore'

export const onUserDeletedFn = functions
  .runWith({ secrets: [pineconeApiKey] })
  .auth.user()
  .onDelete(async data => {
    try {
      const pinecone = new Pinecone({ apiKey: pineconeApiKey.value() })
      await pinecone.deleteIndex(getIndexId(data.uid))
      log('Deleted pinecone index', { indexId: getIndexId(data.uid) })

      const firestore = getFirestore()
      await firestore.collection('users').doc(data.uid).delete()
      log('Deleted user document', { userId: data.uid })
    } catch (err) {
      error('onUserDeleted: ', err)
      throw err
    }
  })
