import { createXai } from '@ai-sdk/xai'
import { generateText } from 'ai'
import { log } from 'firebase-functions/logger'
import { v4 as getUUID } from 'uuid'
import { xAiApiKey } from '../../../secrets'
import { articleSchema } from '../../resourcesSchemas'
import { ArticleData, ResourceData, ResourceType } from '../../resourcesTypes'
import { GetResourceDocumentArgs } from '../helpersTypes'
import { Timestamp } from 'firebase-admin/firestore'

const SYSTEM_PROMPT = `<prompt>
    <role>system</role>
    <task>
        You are an AI summarization agent. You will receive an article and must produce 
        a concise yet comprehensive summary optimized for embedding and semantic retrieval.
    </task>
    <considerations>
        <purpose>
            This summary is for both human reading and generating 
            embeddings that will be used for semantic search.
        </purpose>
        <length>
            Keep the summary succinct. If the article is lengthy or covers multiple subtopics, 
            use multiple short paragraphs or bullet points to cover each point adequately.
        </length>
        <accuracy>
            Focus on accurately capturing the main ideas, critical details, and context. 
            Avoid personal opinions or unnecessary fluff.
        </accuracy>
        <keywords>
            Include relevant keywords, named entities, and concepts that directly relate 
            to the article's core topics to enhance semantic retrieval.
        </keywords>
    </considerations>
    <instructions>
        1. Provide a concise, comprehensive summary of the article.
        2. Organize the summary in multiple short paragraphs or bullet points if necessary to clarify distinct subtopics.
        3. Refrain from injecting personal commentary, speculation, or opinions.
        4. Emphasize critical information: who, what, when, where, why, how (if applicable).
        5. The output must be embedding-ready, focusing on key terms, context, and important details for semantic search.
        6. The output must not have any markdown formatting.
    </instructions>
    <output_format>
        Return the summarized content in plain text, either as:
        - A short series of cohesive paragraphs, OR
        - A list of bullet points (one per critical concept/subtopic).

        Keep the format minimal, ensuring it's ready for embedding without additional markup.
    </output_format>
</prompt>`

export async function getArticleDocument(req: GetResourceDocumentArgs): Promise<ResourceData> {
  const model = createXai({
    apiKey: xAiApiKey.value(),
  })('grok-beta')

  const response = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt: `<article>${req.url}</article>`,
  })

  const articleData: ArticleData = articleSchema.parse(response)
  log('Article data parsed', { articleData })

  const resourceId = getUUID()

  const resourceDoc: ResourceData = {
    type: ResourceType.ARTICLE,
    title: req.metadata.title,
    resourceId,
    userId: req.userId,
    url: req.url,
    tags: req.metadata.tags,
    description: req.metadata.description,
    createdAt: Timestamp.now().toDate().toISOString(),
    data: {
      text: articleData.text,
    },
  }

  return resourceDoc
}
