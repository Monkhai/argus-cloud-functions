import * as admin from 'firebase-admin'
import { createTweetDocumentFn } from './resources/twitter/createTweetDocument'
import { getRecentResourcesFn } from './resources/getRecentResources'
import { onResourceCreatedFn } from './resources/onResouceCreated'
import { onUserCreatedFn } from './users/onUserCreated'
import { searchResourcesFn } from './resources/searchResources'
import { onUserDeletedFn } from './users/onUserDeleted'
import { updateResourceFn } from './resources/updateResrouce'
import { deleteResourceFn } from './resources/deleteResource'

admin.initializeApp()

// Triggers
export const onUserCreated = onUserCreatedFn
export const onUserDeleted = onUserDeletedFn
export const onResourceCreated = onResourceCreatedFn

// CALLABLE FUNCTIONS
//// resources
export const updateResource = updateResourceFn
export const deleteResource = deleteResourceFn

//// Twitter
export const createTweetDocument = createTweetDocumentFn

//// Pinecone
export const searchResources = searchResourcesFn

//// Firestore
export const getRecentResources = getRecentResourcesFn
