import type { Database } from 'sqlite'
import type { TeamMember } from '../types'
import { getDatabase } from '../config/database'

export async function getAllMembers(db?: Database): Promise<TeamMember[]> {
  const connection = db ?? (await getDatabase())
  return (await connection.all(
    `SELECT id, name, email, role, color FROM members ORDER BY name`
  )) as TeamMember[]
}

export async function getMemberById(id: number, db?: Database): Promise<TeamMember | undefined> {
  const connection = db ?? (await getDatabase())
  return connection.get<TeamMember>(
    `SELECT id, name, email, role, color FROM members WHERE id = ?`,
    [id]
  )
}

export async function createMember(
  member: Omit<TeamMember, 'id'>,
  db?: Database
): Promise<TeamMember> {
  const connection = db ?? (await getDatabase())
  const result = await connection.run(
    `INSERT INTO members (name, email, role, color) VALUES (?, ?, ?, ?)`,
    [member.name, member.email, member.role, member.color]
  )
  return { id: Number(result.lastID), ...member }
}

export async function updateMember(
  id: number,
  member: Omit<TeamMember, 'id'>,
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
  await connection.run(`DELETE FROM members WHERE id = ?`, [id])
}
