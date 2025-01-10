import { ResourceMetadata } from '../resourcesTypes'

export type GetResourceDocumentArgs = {
  url: string
  metadata: ResourceMetadata
  userId: string
}
