import { getFirestore } from 'firebase-admin/firestore'
import * as functions from 'firebase-functions'
import { ResourceData, ResourceType } from './resourcesTypes'
import { error, log } from 'firebase-functions/logger'

type GetRecentResourcesRequest = {
  count: number
  type?: ResourceType
}

type GetRecentResourcesResponse = {
  resources: ResourceData[]
}

export const getRecentResourcesFn = functions.https.onCall<GetRecentResourcesRequest, Promise<GetRecentResourcesResponse>>(async req => {
  try {
    if (!req.auth) {
      throw new functions.https.HttpsError('permission-denied', 'User not authenticated')
    }

    const firestore = getFirestore()
    const userDoc = await firestore.collection('users').doc(req.auth.uid).get()
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found')
    }

    const resourcesSnap = await firestore
      .collection('users')
      .doc(req.auth.uid)
      .collection('resources')
      .orderBy('createdAt', 'desc')
      .limit(req.data.count)
      .get()

    log('Fetched resources', { resources: resourcesSnap.docs.map(doc => doc.data() as ResourceData) })

    const resouces = resourcesSnap.docs.map(doc => doc.data() as ResourceData)
    return { resources: resouces }
  } catch (err) {
    error('getRecentResources: ', err)
    throw err
  }
})
