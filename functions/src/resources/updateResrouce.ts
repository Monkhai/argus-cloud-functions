import * as functions from 'firebase-functions'
import { pineconeApiKey } from '../secrets'
import { error, log } from 'firebase-functions/logger'
import { getIndexId } from '../utils/getPineconeIndexId'
import { Pinecone } from '@pinecone-database/pinecone'
import { IndexEntryMetadata, ResourceData } from './resourcesTypes'
import { resourceDocumentSchema } from './resourcesSchemas'
import { pathStore } from '../pathStore'
import { getFirestore } from 'firebase-admin/firestore'

type UpdateResourceRequest = {
  resourceId: string
  resourceData: ResourceData
}

type UpdateResourceResponse = {
  success: boolean
}

export const updateResourceFn = functions.https.onCall<UpdateResourceRequest, Promise<UpdateResourceResponse>>(
  { secrets: [pineconeApiKey] },
  async req => {
    try {
      if (!req.auth) {
        throw new functions.https.HttpsError('permission-denied', 'User not authenticated')
      }

      const { resourceId, resourceData } = req.data

      const resourceDocument = resourceDocumentSchema.parse(resourceData)
      log('Resource document parsed', { resourceDocument })

      const path = pathStore.oneResource(req.auth.uid, resourceId)
      const firestore = getFirestore()
      const resourceDocRef = firestore.doc(path)

      const pinecone = new Pinecone({ apiKey: pineconeApiKey.value() })
      const index = pinecone.index(getIndexId(req.auth.uid))
      const indexEntryMetadata: IndexEntryMetadata = {
        ...resourceDocument,
      }

      await Promise.all([
        index.update({
          id: resourceId,
          metadata: indexEntryMetadata,
        }),
        resourceDocRef.update(resourceDocument),
      ])
      log('Resource updated', { resourceId })

      return { success: true }
    } catch (err) {
      error('updateResourceFn: ', err)
      throw err
    }
  }
)
