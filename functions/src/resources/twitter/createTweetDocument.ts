import { Scraper } from '@the-convocation/twitter-scraper'
import { getFirestore } from 'firebase-admin/firestore'
import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/https'
import { error, log } from 'firebase-functions/logger'
import { ParsedTweet, tweetSchema } from '../resourcesSchemas'
import { ResourceData, ResourceType, ResourceMetadata } from '../resourcesTypes'

type CreateTweetDocumentRequest = {
  url: string
  userMetadata: ResourceMetadata
}

type CreateTweetDocumentResponse = {
  success: boolean
}

export const createTweetDocumentFn = functions.https.onCall<CreateTweetDocumentRequest, Promise<CreateTweetDocumentResponse>>(async req => {
  try {
    if (!req.auth) {
      throw new HttpsError('permission-denied', 'User not authenticated')
    }

    // convert to a URL so that we can test the domain and so on
    const url = new URL(req.data.url)
    if (url.hostname !== 'x.com' && url.hostname !== 'twitter.com') {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid tweet URL')
    }

    const tweetId = url.pathname.split('/').pop()
    if (!tweetId) {
      throw new functions.https.HttpsError('invalid-argument', 'No tweet ID found')
    }

    const metadata = req.data.userMetadata as ResourceMetadata
    if (!metadata) {
      throw new functions.https.HttpsError('invalid-argument', 'No user metadata found')
    }

    const scraper = new Scraper()
    const tweetData = await scraper.getTweet(tweetId)
    if (!tweetData) {
      throw new functions.https.HttpsError('invalid-argument', 'Failed to fetch tweet data')
    }
    log('Fetched tweet data', { tweetId })

    let tweet: ParsedTweet
    try {
      tweet = tweetSchema.parse(tweetData)
    } catch (err) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid tweet returned from API')
    }
    log('Parsed tweet data', { tweet })

    const resourceDoc: ResourceData = {
      type: ResourceType.TWEET,
      resourceId: tweetId,
      createdAt: new Date(tweet.timestamp).toISOString(),
      text: tweet.text,
      authorUsername: tweet.username,
      authorId: tweet.userId,
      userId: req.auth.uid,
      url: url.toString(),
      tags: metadata.tags,
      description: metadata.description,
    }

    const firestore = getFirestore()
    await firestore.collection('users').doc(req.auth.uid).collection('resources').doc(tweetId).set(resourceDoc)
    log('Created resource document', { resourceDoc })

    return { success: true }
  } catch (err) {
    error('createTweetDocument: ', err)
    throw err
  }
})
