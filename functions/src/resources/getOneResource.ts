import { getFirestore } from 'firebase-admin/firestore'
import * as functions from 'firebase-functions'
import { ResourceData } from './resourcesTypes'
import { telelogger, TELELOGGER_CHAT_ID, TELELOGGER_TOKEN } from '../logger'

type GetOneResourceRequest = {
  resourceId: string
}

type GetOneResourceResponse = {
  resource: ResourceData
}

export const getOneResourceFn = functions.https.onCall<GetOneResourceRequest, Promise<GetOneResourceResponse>>(
  {
    secrets: [TELELOGGER_TOKEN, TELELOGGER_CHAT_ID],
  },
  async req => {
    try {
      if (!req.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Request not authenticated')
      }

      const resourceDoc = await getFirestore().collection('users').doc(req.auth.uid).collection('resources').doc(req.data.resourceId).get()
      if (!resourceDoc.exists) {
        telelogger.logError('getOneResourceFn: resource not found')
        throw new functions.https.HttpsError('not-found', 'Resource not found')
      }
      telelogger.logSuccess('getOneResourceFn: resource found')

      return { resource: resourceDoc.data() as ResourceData }
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        telelogger.logError(`getOneResourceFn:\n${error.message}`)
      } else {
        telelogger.logError((error as Error).message)
      }
      throw error
    }
  }
)
