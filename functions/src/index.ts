import * as admin from 'firebase-admin'
import { deleteResourceFn } from './resources/deleteResource'
import { getRecentResourcesFn } from './resources/getRecentResources'
import { onResourceCreatedFn } from './resources/onResouceCreated'
import { searchResourcesFn } from './resources/searchResources'
import { updateResourceFn } from './resources/updateResrouce'
import { onUserCreatedFn } from './users/onUserCreated'
import { onUserDeletedFn } from './users/onUserDeleted'
import { createResourceDocumentFn } from './resources/createResourceDocument'
import { downloadYoutubeVideoFn } from './resources/downloadResourceYoutube'
import { getOneResourceFn } from './resources/getOneResource'

admin.initializeApp()

// Triggers
export const onUserCreated = onUserCreatedFn
export const onUserDeleted = onUserDeletedFn
export const onResourceCreated = onResourceCreatedFn

// CALLABLE FUNCTIONS
//// resources
export const createResourceDocument = createResourceDocumentFn
export const updateResource = updateResourceFn
export const deleteResource = deleteResourceFn

//// youtube
export const downloadYoutubeVideo = downloadYoutubeVideoFn

//// Pinecone
export const searchResources = searchResourcesFn

//// Firestore
export const getRecentResources = getRecentResourcesFn
export const getOneResource = getOneResourceFn
