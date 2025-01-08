import * as admin from 'firebase-admin'
import { createTweetDocumentFn } from './createTweetDocument'
import { getRecentResourcesFn } from './getRecentResources'
import { onResourceCreatedFn } from './onResouceCreated'
import { onUserCreatedFn } from './users/onUserCreated'
import { searchResourcesFn } from './searchResources'
import { onUserDeletedFn } from './users/onUserDeleted'

admin.initializeApp()

// Triggers
export const onUserCreated = onUserCreatedFn
export const onUserDeleted = onUserDeletedFn
export const onResourceCreated = onResourceCreatedFn

// CALLABLE FUNCTIONS
//// Twitter
export const createTweetDocument = createTweetDocumentFn

//// Pinecone
export const searchResources = searchResourcesFn

//// Firestore
export const getRecentResources = getRecentResourcesFn
