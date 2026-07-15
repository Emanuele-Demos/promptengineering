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
import { generateRandomLastName } from '../utils/randomLastName'
import { buildInstitutionalEmail } from '../utils/institutionalEmail'
import { parseUserIdFromTokenSub } from '../utils/memberId'
import { createOnboardingTaskForMember } from './onboardingService'

export interface AuthMember extends TeamMember {
  password: string
  firstName?: string
  lastName?: string
  username?: string | null
  isActive?: number
}

export interface AuthUser {
  id: number
  name: string
  firstName: string
  lastName: string
  email: string
  role: string
  color: string
}

function toAuthUser(member: {
  id: number
  name: string
  email: string
  role: string
  color: string
  firstName?: string | null
  lastName?: string | null
}): AuthUser {
  const parts = member.name.trim().split(/\s+/)
  return {
    id: member.id,
    name: member.name,
    firstName: member.firstName?.trim() || parts[0] || member.name,
    lastName: member.lastName?.trim() || parts.slice(1).join(' ') || '',
    email: member.email,
    role: member.role,
    color: member.color,
  }
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
  onboardingTask?: { id: string; title: string }
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

export function signToken(userId: number, rememberMe = false): { token: string; expiresIn: string } {
  const expiresIn = rememberMe ? JWT_REMEMBER_EXPIRES_IN : JWT_EXPIRES_IN
  const options: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'] }
  const token = jwt.sign({ sub: userId }, JWT_SECRET, options)
  return { token, expiresIn }
}

export function verifyToken(token: string): { userId: number } {
  const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload
  const userId = parseUserIdFromTokenSub(payload.sub)
  if (userId === null) {
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
    `SELECT id, name, firstName, lastName, email, role, color, password, isActive
     FROM members WHERE LOWER(email) = LOWER(?)`,
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

export async function getAuthUserById(id: number, db?: Database): Promise<AuthUser | undefined> {
  const connection = db ?? (await getDatabase())
  const row = await connection.get<{
    id: number
    name: string
    firstName: string | null
    lastName: string | null
    email: string
    role: string
    color: string
  }>(
    `SELECT id, name, firstName, lastName, email, role, color FROM members WHERE id = ?`,
    [id]
  )
  return row ? toAuthUser(row) : undefined
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
  return { user: toAuthUser(member), token, expiresIn }
}

export async function register(input: RegisterInput): Promise<RegisterResult> {
  const db = await getDatabase()

  const countRow = await db.get<{ count: number }>('SELECT COUNT(*) AS count FROM members')
  const lastName = generateRandomLastName()
  const email = buildInstitutionalEmail(input.firstName, lastName)
  const name = `${input.firstName} ${lastName}`

  const existingGeneratedEmail = await getMemberByEmail(email, db)
  if (existingGeneratedEmail) {
    const error = new Error('Email già registrata') as Error & { statusCode?: number }
    error.statusCode = 409
    throw error
  }

  const color = pickMemberColor(countRow?.count ?? 0)
  const hashedPassword = await hashPassword(input.password)
  const now = new Date().toISOString()

  if (input.username) {
    const existingUsername = await getMemberByUsername(input.username, db)
    if (existingUsername) {
      const error = new Error('Username già in uso') as Error & { statusCode?: number }
      error.statusCode = 409
      throw error
    }
  }

  const insertResult = await db.run(
    `INSERT INTO members (
      name, firstName, lastName, username, email, role, color,
      password, isActive, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      input.firstName,
      lastName,
      input.username ?? null,
      email,
      input.role,
      color,
      hashedPassword,
      1,
      now,
      now,
    ]
  )

  const id = Number(insertResult.lastID)
  const onboardingTask = await createOnboardingTaskForMember(id, input.role, db)

  const user: AuthUser = {
    id,
    name,
    firstName: input.firstName,
    lastName,
    email,
    role: input.role,
    color,
  }

  const result: RegisterResult = {
    success: true,
    message: `Registrazione completata con email ${email}. Ti è stata assegnata la task: "${onboardingTask.title}".`,
    onboardingTask,
  }

  if (AUTO_LOGIN_AFTER_REGISTER) {
    const { token, expiresIn } = signToken(id, false)
    result.user = user
    result.token = token
    result.expiresIn = expiresIn
  }

  return result
}
