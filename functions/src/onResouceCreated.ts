import * as functions from 'firebase-functions'
import { Pinecone } from '@pinecone-database/pinecone'
import OpenAI from 'openai'
import { openaiApiKey, pineconeApiKey } from './secrets'
import { IndexEntryMetadata, ResourceContentForEmbedding, ResourceData, ResourceType } from './types'
import { getIndexId } from './utils'
import { resourceDocumentSchema } from './schemas'
import { log, error } from 'firebase-functions/logger'
import { abstractPathStore } from './pathStore'

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
        type: ResourceType.TWEET,
        text: resourceDocument.text,
        description: resourceDocument.description,
        authorUsername: resourceDocument.authorUsername,
        authorId: resourceDocument.authorId,
        createdAt: resourceDocument.createdAt,
        tags: resourceDocument.tags,
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
        text: resourceDocument.text,
        type: ResourceType.TWEET,
        authorUsername: resourceDocument.authorUsername,
        authorId: resourceDocument.authorId,
        createdAt: resourceDocument.createdAt,
        tags: resourceDocument.tags,
        description: resourceDocument.description,
        userId: resourceDocument.userId,
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
