const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(
  /\/api\/?$/,
  '',
)

export function resolveAvatarUrl(
  avatarUrl?: string | null,
  cacheKey?: string | number | null,
): string | null {
  if (!avatarUrl?.trim()) return null

  const path = avatarUrl.startsWith('http')
    ? avatarUrl
    : `${API_ORIGIN}${avatarUrl.startsWith('/') ? avatarUrl : `/${avatarUrl}`}`

  if (cacheKey === undefined || cacheKey === null || cacheKey === '') {
    return path
  }

  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}v=${encodeURIComponent(String(cacheKey))}`
}
