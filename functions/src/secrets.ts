import { defineSecret } from 'firebase-functions/params'

export const pineconeApiKey = defineSecret('PINECONE_API_KEY')
export const openaiApiKey = defineSecret('OPENAI_API_KEY')
