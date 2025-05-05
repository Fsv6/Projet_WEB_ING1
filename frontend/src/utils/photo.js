export function getPhotoUrl(photo, userId) {
  if (userId) return `http://localhost:5000/api/users/${userId}/photo`;
  return require('@/assets/default-avatar.png');
} 