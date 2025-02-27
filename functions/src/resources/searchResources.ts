import * as functions from 'firebase-functions'
import { openaiApiKey, pineconeApiKey } from '../secrets'
import { HttpsError } from 'firebase-functions/https'
import OpenAI from 'openai'
import { Pinecone } from '@pinecone-database/pinecone'
import { IndexEntryMetadata, ResourceContentForEmbedding, ResourceData, ResourceType } from './resourcesTypes'
import { getIndexId } from '../utils/getPineconeIndexId'
import { error, log } from 'firebase-functions/logger'

type SearchResourcesRequest = {
  prompt: string
  authorUsername?: string
  tags?: string[]
  description?: string
  type?: ResourceType
  title?: string
}

type SearchResourcesResponse = {
  resources: ResourceData[]
}

export const searchResourcesFn = functions.https.onCall<SearchResourcesRequest, Promise<SearchResourcesResponse>>(
  { secrets: [pineconeApiKey, openaiApiKey] },
  async req => {
    try {
      if (!req.auth) {
        throw new HttpsError('permission-denied', 'User not authenticated')
      }

      const prompt = req.data.prompt
      if (!prompt) {
        throw new functions.https.HttpsError('invalid-argument', 'No prompt found')
      }

      const openai = new OpenAI({
        apiKey: openaiApiKey.value(),
        dangerouslyAllowBrowser: true,
      })

      // const enrichedPromptResponse = await openai.chat.completions.create({
      //   model: 'gpt-4o-mini',
      //   messages: [
      //     {
      //       role: 'system',
      //       content: ENRICHMENT_SYSTEM_PROMPT,
      //     },
      //     {
      //       role: 'user',
      //       content: `<query>${prompt}</query>`,
      //     },
      //   ],
      // })

      // log('Enriched prompt response', { enrichedPromptResponse })

      // const enrichedPrompt = enrichedPromptResponse.choices[0].message.content
      // if (!enrichedPrompt) {
      //   throw new functions.https.HttpsError('data-loss', 'Enriched prompt not found')
      // }
      // log('Enriched prompt content', { enrichedPrompt })

      const pinecone = new Pinecone({ apiKey: pineconeApiKey.value() })
      const index = pinecone.index(getIndexId(req.auth.uid))

      const resourceToEmbed = getStructuredQuery({
        query: prompt,
        description: req.data.description || '',
        tags: req.data.tags || [],
        authorUsername: req.data.authorUsername || '',
        title: req.data.title || '',
      })

      const embeddedPrompt = await openai.embeddings.create({
        input: JSON.stringify(resourceToEmbed, Object.keys(resourceToEmbed).sort()),
        model: 'text-embedding-ada-002',
      })
      log('Embedded prompt')

      const queryVector = embeddedPrompt.data[0].embedding
      const queryResponse = await index.query({
        topK: 10,
        includeMetadata: true,
        vector: queryVector,
      })
      log('Pinecone query response', { queryResponse })

      return {
        resources: queryResponse.matches.map(match => {
          const metadata = match.metadata as IndexEntryMetadata
          return {
            type: metadata.type,
            url: metadata.url,
            resourceId: metadata.resourceId,
            tags: metadata.tags,
            description: metadata.description,
            userId: metadata.userId,
            createdAt: metadata.createdAt,
            data: {
              text: metadata.text,
              authorUsername: metadata.authorUsername,
              authorId: metadata.authorId,
            },
          } as ResourceData
        }),
      }
    } catch (err) {
      error('searchResources: ', err)
      throw err
    }
  }
)

// const ENRICHMENT_SYSTEM_PROMPT = `<role>
// You are helping to create a concise and effective search query for semantic search of resources such as articles, videos, tweets, podcasts, and other resources.
// </role>

// <task>
// Expand and enrich the given search query to improve semantic matching by including related terms and concepts.
// </task>

// <instructions>
// - Focus on relevant terms, keywords, and phrases.
// - Avoid using instructive or procedural language (e.g., "looking for" or "discussing").
// - Do not include unnecessary descriptors or explanations.
// - Keep the output concise and keyword-rich, focusing solely on concepts related to the query.
// - Use full sentences and natural language.
// - Ensure the query is short. No longer than 10 words more than the original query.
// </instructions>

// <output_format>
// Return only the enriched query text as a single line of keywords and phrases. Avoid full sentences or explanations.
// </output_format>`

const getStructuredQuery = ({
  authorUsername,
  description,
  query,
  tags,
  title,
}: {
  query: string
  tags: string[]
  description: string
  authorUsername: string
  title: string
}): ResourceContentForEmbedding => {
  return {
    text: query,
    authorUsername,
    tags,
    description,
    title,
    authorId: '',
    createdAt: '',
    type: '',
  }
}
