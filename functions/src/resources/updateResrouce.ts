import * as functions from 'firebase-functions'
import { pineconeApiKey } from '../secrets'
import { error, log } from 'firebase-functions/logger'
import { getIndexId } from '../utils/getPineconeIndexId'
import { Pinecone } from '@pinecone-database/pinecone'
import { IndexEntryMetadata, ResourceData, ResourceMetadata, TweetData } from './resourcesTypes'
import { resourceDocumentSchema, resourceMetadataSchema } from './resourcesSchemas'
import { pathStore } from '../pathStore'
import { getFirestore } from 'firebase-admin/firestore'

type UpdateResourceRequest = {
  resourceId: string
  resourceMetadata: ResourceMetadata
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

      const { resourceId, resourceMetadata } = req.data

      const parsedResourceMetadata = resourceMetadataSchema.parse(resourceMetadata)
      log('Resource metadata parsed', { parsedResourceMetadata })

      const path = pathStore.oneResource(req.auth.uid, resourceId)
      const firestore = getFirestore()
      const resourceDocRef = firestore.doc(path)
      const resourceDoc = await resourceDocRef.get()
      const resourceDocument = resourceDocumentSchema.parse(resourceDoc.data())
      log('Resource document parsed', { resourceDocument })

      const updatedResourceDocument: ResourceData = {
        ...resourceDocument,
        ...parsedResourceMetadata,
      }

      const pinecone = new Pinecone({ apiKey: pineconeApiKey.value() })
      const index = pinecone.index(getIndexId(req.auth.uid))
      const indexEntryMetadata: IndexEntryMetadata = {
        description: updatedResourceDocument.description,
        tags: updatedResourceDocument.tags,
        resourceId: updatedResourceDocument.resourceId,
        type: updatedResourceDocument.type,
        url: updatedResourceDocument.url,
        userId: updatedResourceDocument.userId,
        text: updatedResourceDocument.data.text,
        authorId: (updatedResourceDocument.data as TweetData).authorId ?? '',
        authorUsername: (updatedResourceDocument.data as TweetData).authorUsername ?? '',
        createdAt: (updatedResourceDocument.data as TweetData).createdAt ?? '',
      }

      await Promise.all([
        index.update({
          id: resourceId,
          metadata: indexEntryMetadata,
        }),
        resourceDocRef.update(updatedResourceDocument),
      ])
      log('Resource updated', { resourceId })

      return { success: true }
    } catch (err) {
      error('updateResourceFn: ', err)
      throw err
    }
  }
)
