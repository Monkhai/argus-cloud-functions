import * as functions from 'firebase-functions'
import { openaiApiKey, pineconeApiKey } from './secrets'
import { HttpsError } from 'firebase-functions/https'
import OpenAI from 'openai'
import { Pinecone } from '@pinecone-database/pinecone'
import { TweetContentForEmbedding, TweetData } from './types'
import { getIndexId } from './utils'

type SearchTweetsRequest = {
  prompt: string
  authorUsername?: string
  tags?: string[]
  description?: string
}

type SearchTweetsResponse = {
  tweets: TweetData[]
}

export const searchTweetsFn = functions.https.onCall<SearchTweetsRequest, Promise<SearchTweetsResponse>>(
  { secrets: [pineconeApiKey, openaiApiKey] },
  async req => {
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

    const enrichedPromptResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: ENRICHMENT_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `<query>${prompt}</query>`,
        },
      ],
    })

    const enrichedPrompt = enrichedPromptResponse.choices[0].message.content
    if (!enrichedPrompt) {
      throw new functions.https.HttpsError('invalid-argument', 'No enriched prompt found')
    }

    const pinecone = new Pinecone({ apiKey: pineconeApiKey.value() })
    const index = pinecone.index(getIndexId(req.auth.uid))

    const tweetToEmbed = getStructuredQuery({
      query: enrichedPrompt,
      description: req.data.description || '',
      tags: req.data.tags || [],
      authorUsername: req.data.authorUsername || '',
    })

    const embeddedPrompt = await openai.embeddings.create({
      input: JSON.stringify(tweetToEmbed, Object.keys(tweetToEmbed).sort()),
      model: 'text-embedding-ada-002',
    })

    const queryVector = embeddedPrompt.data[0].embedding
    const queryResponse = await index.query({
      topK: 10,
      includeMetadata: true,
      vector: queryVector,
    })

    return { tweets: queryResponse.matches.map(match => match.metadata as TweetData) }
  }
)

const ENRICHMENT_SYSTEM_PROMPT = `<role>
You are helping to create a concise and effective search query for semantic search of tweets.
</role>

<task>
Expand and enrich the given search query to improve semantic matching by including related terms and concepts.
</task>

<instructions>
- Focus on relevant terms, keywords, and phrases.
- Avoid using instructive or procedural language (e.g., "looking for" or "discussing").
- Do not include unnecessary descriptors or explanations.
- Keep the output concise and keyword-rich, focusing solely on concepts related to the query.
- Use full sentences and natural language.
- Ensure the query is short. No longer than 10 words more than the original query.
</instructions>

<output_format>
Return only the enriched query text as a single line of keywords and phrases. Avoid full sentences or explanations.
</output_format>`

const getStructuredQuery = ({
  authorUsername,
  description,
  query,
  tags,
}: {
  query: string
  tags: string[]
  description: string
  authorUsername: string
}): TweetContentForEmbedding => {
  return {
    text: query,
    authorUsername,
    tags,
    description,
    authorId: '',
    createdAt: '',
  }
}
