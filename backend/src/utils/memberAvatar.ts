import type { TeamMember } from '../types'

export function toMemberAvatarUrl(avatarPath: string | null | undefined): string | null {
  const path = avatarPath?.trim()
  return path ? path : null
}

export function mapTeamMember(row: {
  id: number
  name: string
  email: string
  role: string
  color: string
  avatarPath?: string | null
}): TeamMember {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    color: row.color,
    avatarUrl: toMemberAvatarUrl(row.avatarPath),
  }
}
