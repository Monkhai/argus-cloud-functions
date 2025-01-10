import { Pinecone } from '@pinecone-database/pinecone'
import * as functions from 'firebase-functions'
import { error, log } from 'firebase-functions/logger'
import OpenAI from 'openai'
import { abstractPathStore } from '../pathStore'
import { openaiApiKey, pineconeApiKey } from '../secrets'
import { getIndexId } from '../utils/getPineconeIndexId'
import { resourceDocumentSchema } from './resourcesSchemas'
import { IndexEntryMetadata, ResourceContentForEmbedding, ResourceData, TweetData } from './resourcesTypes'

export const onResourceCreatedFn = functions.firestore.onDocumentCreated(
  {
    document: abstractPathStore.oneResource,
    secrets: [pineconeApiKey, openaiApiKey],
  },
  async event => {
    try {
      if (!event.data) {
        throw new Error('No tweet data found. Empty document')
      }
      const pinecone = new Pinecone({ apiKey: pineconeApiKey.value() })
      const openai = new OpenAI({
        apiKey: openaiApiKey.value(),
      })

      const resourceData = event.data.data() as ResourceData
      const resourceDocument = resourceDocumentSchema.parse(resourceData)

      const resourceContentForEmbedding: ResourceContentForEmbedding = {
        type: resourceDocument.type,
        text: resourceDocument.data.text,
        tags: resourceDocument.tags,
        description: resourceDocument.description,
        createdAt: resourceDocument.createdAt,
        authorUsername: (resourceDocument.data as TweetData).authorUsername ?? '',
        authorId: (resourceDocument.data as TweetData).authorId ?? '',
      }

      const embedding = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: JSON.stringify(resourceContentForEmbedding, Object.keys(resourceContentForEmbedding).sort()),
      })
      log('Embeddign created')

      const indexId = getIndexId(resourceDocument.userId)
      const index = pinecone.index(indexId)

      const indexEntryMetadata: IndexEntryMetadata = {
        url: resourceDocument.url,
        resourceId: resourceDocument.resourceId,
        type: resourceDocument.type,
        tags: resourceDocument.tags,
        description: resourceDocument.description,
        userId: resourceDocument.userId,
        text: resourceDocument.data.text,
        createdAt: resourceDocument.createdAt,
        authorUsername: (resourceDocument.data as TweetData).authorUsername ?? '',
        authorId: (resourceDocument.data as TweetData).authorId ?? '',
      }

      await index.upsert([
        {
          id: resourceDocument.resourceId,
          values: embedding.data[0].embedding,
          metadata: indexEntryMetadata,
        },
      ])

      log('Resouce embedded and indexed', { resourceId: resourceDocument.resourceId })
    } catch (err) {
      error('onReourceCreated: ', err)
    }
  }
)
