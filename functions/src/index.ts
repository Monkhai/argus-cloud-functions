import * as admin from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'
import * as functions from 'firebase-functions'
import { createTweetDocumentFn, onTweetCreatedFn } from './createTweetDocument'
import { onUserCreatedFn } from './onUserCreated'
import { searchTweetsFn } from './searchTweets'

admin.initializeApp()

export const onUserCreated = onUserCreatedFn
export const createTweetDocument = createTweetDocumentFn
export const onTweetCreated = onTweetCreatedFn
export const searchTweets = searchTweetsFn

export const getRecentTweets = functions.https.onCall<{ count: number }>(async data => {
  const firestore = getFirestore()
  const tweets = await firestore.collection('tweets').orderBy('createdAt', 'desc').limit(data.data.count).get()
  return tweets.docs.map(doc => doc.data())
})

export const getTweetsByAuthor = functions.https.onCall<{ authorUsername: string }>(async data => {
  const firestore = getFirestore()
  const tweets = await firestore.collection('tweets').where('authorUsername', '==', data.data.authorUsername).get()
  return tweets.docs.map(doc => doc.data())
})
