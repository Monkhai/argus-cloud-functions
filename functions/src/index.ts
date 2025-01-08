import * as admin from 'firebase-admin'
import { createTweetDocumentFn } from './createTweetDocument'
import { getRecentResourcesFn } from './getRecentResources'
import { onResourceCreatedFn } from './onResouceCreated'
import { onUserCreatedFn } from './onUserCreated'
import { searchResourcesFn } from './searchResources'

admin.initializeApp()

// Triggers
export const onUserCreated = onUserCreatedFn
export const onResourceCreated = onResourceCreatedFn

// CALLABLE FUNCTIONS
//// Twitter
export const createTweetDocument = createTweetDocumentFn

//// Pinecone
export const searchResources = searchResourcesFn

//// Firestore
export const getRecentResources = getRecentResourcesFn
