import type { Database } from 'sqlite'
import type { TeamMember } from '../types'
import { getDatabase } from '../config/database'
import { deleteAvatarForMember } from './avatarService'
import { mapTeamMember } from '../utils/memberAvatar'

type MemberRow = {
  id: number
  name: string
  email: string
  role: string
  color: string
  avatarPath: string | null
}

const MEMBER_SELECT = `SELECT id, name, email, role, color, avatarPath FROM members`

export async function getAllMembers(db?: Database): Promise<TeamMember[]> {
  const connection = db ?? (await getDatabase())
  const rows = (await connection.all(`${MEMBER_SELECT} ORDER BY name`)) as MemberRow[]
  return rows.map(mapTeamMember)
}

export async function getMemberById(id: number, db?: Database): Promise<TeamMember | undefined> {
  const connection = db ?? (await getDatabase())
  const row = await connection.get<MemberRow>(`${MEMBER_SELECT} WHERE id = ?`, [id])
  return row ? mapTeamMember(row) : undefined
}

export async function createMember(
  member: Omit<TeamMember, 'id' | 'avatarUrl'>,
  db?: Database
): Promise<TeamMember> {
  const connection = db ?? (await getDatabase())
  const result = await connection.run(
    `INSERT INTO members (name, email, role, color) VALUES (?, ?, ?, ?)`,
    [member.name, member.email, member.role, member.color]
  )
  return { id: Number(result.lastID), ...member, avatarUrl: null }
}

export async function updateMember(
  id: number,
  member: Omit<TeamMember, 'id' | 'avatarUrl'>,
  db?: Database
): Promise<void> {
  const connection = db ?? (await getDatabase())
  await connection.run(
    `UPDATE members SET name = ?, email = ?, role = ?, color = ? WHERE id = ?`,
    [member.name, member.email, member.role, member.color, id]
  )
}

export async function deleteMember(id: number, db?: Database): Promise<void> {
  const connection = db ?? (await getDatabase())
  await deleteAvatarForMember(id, connection)
  await connection.run(`DELETE FROM members WHERE id = ?`, [id])
}
