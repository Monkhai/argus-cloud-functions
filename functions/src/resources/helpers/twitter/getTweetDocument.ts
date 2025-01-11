import { Scraper } from '@the-convocation/twitter-scraper'
import * as functions from 'firebase-functions'
import { log } from 'firebase-functions/logger'
import { ParsedTweet, tweetSchema } from '../../resourcesSchemas'
import { ResourceData, ResourceMetadata, ResourceType } from '../../resourcesTypes'
import { GetResourceDocumentArgs } from '../helpersTypes'
import { Timestamp } from 'firebase-admin/firestore'

export async function getTweetDocument(req: GetResourceDocumentArgs): Promise<ResourceData> {
  const url = new URL(req.url)
  if (url.hostname !== 'x.com' && url.hostname !== 'twitter.com') {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid tweet URL')
  }

  const tweetId = url.pathname.split('/').pop()
  if (!tweetId) {
    throw new functions.https.HttpsError('invalid-argument', 'No tweet ID found')
  }

  const metadata = req.metadata as ResourceMetadata
  if (!metadata) {
    throw new functions.https.HttpsError('invalid-argument', 'No user metadata found')
  }

  const scraper = new Scraper()
  const tweetData = await scraper.getTweet(tweetId)
  if (!tweetData) {
    throw new functions.https.HttpsError('invalid-argument', 'Failed to fetch tweet data')
  }
  log('Fetched tweet data', { tweetId })

  tweetData.timeParsed

  let tweet: ParsedTweet
  try {
    tweet = tweetSchema.parse(tweetData)
  } catch (err) {
    throw new functions.https.HttpsError('invalid-argument', 'Failed to parse tweet data')
  }
  log('Parsed tweet data', { tweet })

  const resourceDoc: ResourceData = {
    type: ResourceType.TWEET,
    title: req.metadata.title,
    resourceId: tweetId,
    userId: req.userId,
    url: url.toString(),
    tags: metadata.tags,
    description: metadata.description,
    createdAt: Timestamp.now().toDate().toISOString(),
    data: {
      authorUsername: tweet.username,
      authorId: tweet.userId,
      text: tweet.text,
    },
  }

  return resourceDoc
}
