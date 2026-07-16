import crypto from 'crypto'
import { getDatabase } from '../config/database'
import { getMemberByEmail, hashPassword } from './authService'
import { sendPasswordResetEmail } from './passwordResetMailService'

const TOKEN_EXPIRY_MS = 60 * 60 * 1000

export const PASSWORD_RESET_GENERIC_MESSAGE =
  "Se l'email è registrata, riceverrai le istruzioni per reimpostare la password."

function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  const member = await getMemberByEmail(email)

  if (!member || member.isActive === 0) {
    return { message: PASSWORD_RESET_GENERIC_MESSAGE }
  }

  const db = await getDatabase()
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashToken(rawToken)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY_MS).toISOString()

  await db.run(
    `UPDATE password_reset_tokens SET usedAt = ? WHERE memberId = ? AND usedAt IS NULL`,
    [now.toISOString(), member.id]
  )

  await db.run(
    `INSERT INTO password_reset_tokens (memberId, tokenHash, expiresAt, createdAt)
     VALUES (?, ?, ?, ?)`,
    [member.id, tokenHash, expiresAt, now.toISOString()]
  )

  await sendPasswordResetEmail(member.email, rawToken)

  return { message: PASSWORD_RESET_GENERIC_MESSAGE }
}

export async function resetPassword(
  token: string,
  password: string
): Promise<{ message: string }> {
  const tokenHash = hashToken(token)
  const db = await getDatabase()
  const now = new Date().toISOString()

  const row = await db.get<{
    id: number
    memberId: number
    expiresAt: string
  }>(
    `SELECT id, memberId, expiresAt FROM password_reset_tokens
     WHERE tokenHash = ? AND usedAt IS NULL`,
    [tokenHash]
  )

  if (!row || row.expiresAt <= now) {
    const error = new Error('Link di reimpostazione non valido o scaduto') as Error & {
      statusCode?: number
    }
    error.statusCode = 400
    throw error
  }

  const hashedPassword = await hashPassword(password)

  await db.run('BEGIN TRANSACTION')
  try {
    await db.run(`UPDATE members SET password = ?, updatedAt = ? WHERE id = ?`, [
      hashedPassword,
      now,
      row.memberId,
    ])
    await db.run(`UPDATE password_reset_tokens SET usedAt = ? WHERE id = ?`, [now, row.id])
    await db.run('COMMIT')
  } catch (error) {
    await db.run('ROLLBACK')
    throw error
  }

  return {
    message: 'Password reimpostata con successo. Ora puoi accedere con la nuova password.',
  }
}
