import { defineSecret } from 'firebase-functions/params'

export const pineconeApiKey = defineSecret('PINECONE_API_KEY')
export const openaiApiKey = defineSecret('OPENAI_API_KEY')
export const xAiApiKey = defineSecret('X_AI_API_KEY')
