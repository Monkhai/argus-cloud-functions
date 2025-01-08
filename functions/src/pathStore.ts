export const abstractPathStore = {
  users: 'users',
  oneUser: 'users/{userId}',
  resources: 'users/{userId}/resources',
  oneResource: 'users/{userId}/resources/{resourceId}',
}

export const pathStore = {
  users: (userId: string) => `users/${userId}`,
  oneUser: (userId: string) => `users/${userId}`,
  resources: (userId: string) => `users/${userId}/resources`,
  oneResource: (userId: string, resourceId: string) => `users/${userId}/resources/${resourceId}`,
}
