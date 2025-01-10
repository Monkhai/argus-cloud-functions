import * as functions from 'firebase-functions'
import { error } from 'firebase-functions/logger'
import { pineconeApiKey } from '../secrets'
import { pathStore } from '../pathStore'
import { getFirestore } from 'firebase-admin/firestore'
import { Pinecone } from '@pinecone-database/pinecone'
import { getIndexId } from '../utils/getPineconeIndexId'

type DeleteResourceRequest = {
  resourceId: string
}

type DeleteResourceResponse = {
  success: boolean
}

export const deleteResourceFn = functions.https.onCall<DeleteResourceRequest, Promise<DeleteResourceResponse>>(
  { secrets: [pineconeApiKey] },
  async req => {
    try {
      if (!req.auth) {
        throw new functions.https.HttpsError('permission-denied', 'User not authenticated')
      }

      const { resourceId } = req.data

      const path = pathStore.oneResource(req.auth.uid, resourceId)
      const firestore = getFirestore()
      const resourceDocRef = firestore.doc(path)

      const pinecone = new Pinecone({ apiKey: pineconeApiKey.value() })
      const index = pinecone.index(getIndexId(req.auth.uid))

      await Promise.all([resourceDocRef.delete(), index.deleteOne(resourceId)])

      return { success: true }
    } catch (err) {
      error('deleteResourceFn: ', err)
      throw err
    }
  }
)
