import fs from 'fs'
import type { Database } from 'sqlite'
import { getDatabase } from '../config/database'
import {
  getAvatarAbsolutePath,
  getAvatarPublicPath,
} from '../middleware/avatarUpload'

export async function getMemberAvatarPath(
  memberId: number,
  db?: Database
): Promise<string | null> {
  const connection = db ?? (await getDatabase())
  const row = await connection.get<{ avatarPath: string | null }>(
    `SELECT avatarPath FROM members WHERE id = ?`,
    [memberId]
  )
  return row?.avatarPath?.trim() || null
}

function deleteAvatarFile(publicPath: string | null | undefined): void {
  if (!publicPath?.trim()) return
  const absolutePath = getAvatarAbsolutePath(publicPath)
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath)
  }
}

export async function setMemberAvatar(
  memberId: number,
  filename: string
): Promise<string> {
  const db = await getDatabase()
  const previousPath = await getMemberAvatarPath(memberId, db)
  const publicPath = getAvatarPublicPath(memberId, filename)
  const now = new Date().toISOString()

  if (previousPath && previousPath !== publicPath) {
    deleteAvatarFile(previousPath)
  }

  await db.run(`UPDATE members SET avatarPath = ?, updatedAt = ? WHERE id = ?`, [
    publicPath,
    now,
    memberId,
  ])

  return publicPath
}

export async function removeMemberAvatar(memberId: number): Promise<void> {
  const db = await getDatabase()
  const previousPath = await getMemberAvatarPath(memberId, db)
  const now = new Date().toISOString()

  deleteAvatarFile(previousPath)

  await db.run(
    `UPDATE members SET avatarPath = NULL, updatedAt = ? WHERE id = ?`,
    [now, memberId]
  )
}

export async function deleteAvatarForMember(memberId: number, db?: Database): Promise<void> {
  const connection = db ?? (await getDatabase())
  const previousPath = await getMemberAvatarPath(memberId, connection)
  deleteAvatarFile(previousPath)
}
