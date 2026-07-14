import bcrypt from 'bcrypt'
import jwt, { type SignOptions } from 'jsonwebtoken'
import type { Database } from 'sqlite'
import {
  AUTO_LOGIN_AFTER_REGISTER,
  BCRYPT_ROUNDS,
  DEFAULT_SEED_PASSWORD,
  JWT_EXPIRES_IN,
  JWT_REMEMBER_EXPIRES_IN,
  JWT_SECRET,
  MEMBER_COLORS,
} from '../config/auth'
import { getDatabase } from '../config/database'
import type { TeamMember } from '../types'

import type { RegisterInput } from '../validators/registerValidator'

export interface AuthMember extends TeamMember {
  password: string
  firstName?: string
  lastName?: string
  username?: string | null
  isActive?: number
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  color: string
}

export interface LoginResult {
  user: AuthUser
  token: string
  expiresIn: string
}

export interface RegisterResult {
  success: true
  message: string
  user?: AuthUser
  token?: string
  expiresIn?: string
}

function generateMemberId(): string {
  return `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

function pickMemberColor(dbCount: number): string {
  return MEMBER_COLORS[dbCount % MEMBER_COLORS.length]
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function hashDefaultPassword(): Promise<string> {
  return hashPassword(DEFAULT_SEED_PASSWORD)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signToken(userId: string, rememberMe = false): { token: string; expiresIn: string } {
  const expiresIn = rememberMe ? JWT_REMEMBER_EXPIRES_IN : JWT_EXPIRES_IN
  const options: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'] }
  const token = jwt.sign({ sub: userId }, JWT_SECRET, options)
  return { token, expiresIn }
}

export function verifyToken(token: string): { userId: string } {
  const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload
  const userId = typeof payload.sub === 'string' ? payload.sub : ''
  if (!userId) {
    throw new Error('Token non valido')
  }
  return { userId }
}

export async function getMemberByEmail(
  email: string,
  db?: Database
): Promise<AuthMember | undefined> {
  const connection = db ?? (await getDatabase())
  return connection.get<AuthMember>(
    `SELECT id, name, email, role, color, password, isActive FROM members WHERE LOWER(email) = LOWER(?)`,
    [email.trim()]
  )
}

export async function getMemberByUsername(
  username: string,
  db?: Database
): Promise<AuthMember | undefined> {
  const connection = db ?? (await getDatabase())
  return connection.get<AuthMember>(
    `SELECT id FROM members WHERE LOWER(username) = LOWER(?)`,
    [username.trim()]
  )
}

export async function getAuthUserById(id: string, db?: Database): Promise<AuthUser | undefined> {
  const connection = db ?? (await getDatabase())
  return connection.get<AuthUser>(
    `SELECT id, name, email, role, color FROM members WHERE id = ?`,
    [id]
  )
}

export async function login(
  email: string,
  password: string,
  rememberMe = false
): Promise<LoginResult> {
  const member = await getMemberByEmail(email)
  if (!member) {
    const error = new Error('Utente non trovato') as Error & { statusCode?: number }
    error.statusCode = 404
    throw error
  }

  if (!member.password) {
    const error = new Error('Credenziali non valide') as Error & { statusCode?: number }
    error.statusCode = 401
    throw error
  }

  if (member.isActive === 0) {
    const error = new Error('Account non attivo. Contatta l\'amministratore.') as Error & {
      statusCode?: number
    }
    error.statusCode = 403
    throw error
  }

  const valid = await comparePassword(password, member.password)
  if (!valid) {
    const error = new Error('Credenziali non valide') as Error & { statusCode?: number }
    error.statusCode = 401
    throw error
  }

  const { token, expiresIn } = signToken(member.id, rememberMe)
  const { password: _password, ...user } = member
  return { user, token, expiresIn }
}

export async function register(input: RegisterInput): Promise<RegisterResult> {
  const db = await getDatabase()

  const existingEmail = await getMemberByEmail(input.email, db)
  if (existingEmail) {
    const error = new Error('Email già registrata') as Error & { statusCode?: number }
    error.statusCode = 409
    throw error
  }

  if (input.username) {
    const existingUsername = await getMemberByUsername(input.username, db)
    if (existingUsername) {
      const error = new Error('Username già in uso') as Error & { statusCode?: number }
      error.statusCode = 409
      throw error
    }
  }

  const countRow = await db.get<{ count: number }>('SELECT COUNT(*) AS count FROM members')
  const id = generateMemberId()
  const name = `${input.firstName} ${input.lastName}`
  const color = pickMemberColor(countRow?.count ?? 0)
  const hashedPassword = await hashPassword(input.password)
  const now = new Date().toISOString()

  await db.run(
    `INSERT INTO members (
      id, name, firstName, lastName, username, email, role, color,
      password, isActive, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      name,
      input.firstName,
      input.lastName,
      input.username ?? null,
      input.email,
      'User',
      color,
      hashedPassword,
      1,
      now,
      now,
    ]
  )

  const user: AuthUser = {
    id,
    name,
    email: input.email,
    role: 'User',
    color,
  }

  const result: RegisterResult = {
    success: true,
    message: 'Registrazione completata con successo.',
  }

  if (AUTO_LOGIN_AFTER_REGISTER) {
    const { token, expiresIn } = signToken(id, false)
    result.user = user
    result.token = token
    result.expiresIn = expiresIn
  }

  return result
}
