import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/https'
import { error, log } from 'firebase-functions/logger'
import { CreateResourceDocumentRequest, CreateResourceDocumentResponse, ResourceData, ResourceType } from './resourcesTypes'
import { getTweetDocument } from './helpers/twitter/getTweetDocument'
import { getFirestore } from 'firebase-admin/firestore'
import { GetResourceDocumentArgs } from './helpers/helpersTypes'
import { getArticleDocument } from './helpers/article/getArticleDocument'
import { xAiApiKey } from '../secrets'

const getResourcesFns: Record<ResourceType, (req: GetResourceDocumentArgs) => Promise<ResourceData>> = {
  [ResourceType.TWEET]: getTweetDocument,
  [ResourceType.ARTICLE]: getArticleDocument,
}

export const createResourceDocumentFn = functions.https.onCall<CreateResourceDocumentRequest, Promise<CreateResourceDocumentResponse>>(
  { secrets: [xAiApiKey] },
  async req => {
    try {
      if (!req.auth) {
        throw new HttpsError('permission-denied', 'User not authenticated')
      }

      const { url, userMetadata, type } = req.data
      const getResourceDataFn = getResourcesFns[type]
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
