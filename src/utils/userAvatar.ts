export type UserAvatarSelection =
  | { type: 'preset'; value: string }
  | { type: 'image'; value: string }

const AVATAR_KEY_PREFIX = 'teamflow-avatar:'

function getAvatarKey(userId: number | string): string {
  return `${AVATAR_KEY_PREFIX}${userId}`
}

export function getUserAvatar(userId: number | string): UserAvatarSelection | null {
  const raw = localStorage.getItem(getAvatarKey(userId))
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as UserAvatarSelection
    if (!parsed || (parsed.type !== 'preset' && parsed.type !== 'image')) return null
    if (typeof parsed.value !== 'string' || !parsed.value.trim()) return null
    return parsed
  } catch {
    return null
  }
}

export function saveUserAvatar(userId: number | string, avatar: UserAvatarSelection): void {
  localStorage.setItem(getAvatarKey(userId), JSON.stringify(avatar))
}

export function clearUserAvatar(userId: number | string): void {
  localStorage.removeItem(getAvatarKey(userId))
}