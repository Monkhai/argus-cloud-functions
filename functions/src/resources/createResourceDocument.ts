import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/https'
import { error, log } from 'firebase-functions/logger'
import { CreateResourceDocumentRequest, CreateResourceDocumentResponse, ResourceData, ResourceType } from './resourcesTypes'
import { getTweetData, GetTweetDataRequest } from './twitter/getTweetData'
import { getFirestore } from 'firebase-admin/firestore'

const getResourcesFns: Record<ResourceType, (req: GetTweetDataRequest) => Promise<ResourceData>> = {
  [ResourceType.TWEET]: getTweetData,
}

export const createResourceDocumentFn = functions.https.onCall<CreateResourceDocumentRequest, Promise<CreateResourceDocumentResponse>>(
  async req => {
    try {
      if (!req.auth) {
        throw new HttpsError('permission-denied', 'User not authenticated')
      }

      const { url, userMetadata } = req.data
      const resourceType = req.data.type
      const getResourceDataFn = getResourcesFns[resourceType]
      const resourceDoc = await getResourceDataFn({ url, metadata: userMetadata, userId: req.auth.uid })

      const firestore = getFirestore()
      await firestore.collection('users').doc(req.auth.uid).collection('resources').doc(resourceDoc.resourceId).set(resourceDoc)
      log('Created resource document', { resourceDoc })

      return { success: true }
    } catch (err) {
      error('createResourceDocumentFn: ', err)
      throw err
    }
  }
)
