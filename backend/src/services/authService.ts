import bcrypt from 'bcrypt'
import jwt, { type SignOptions } from 'jsonwebtoken'
import type { Database } from 'sqlite'
import {
  BCRYPT_ROUNDS,
  DEFAULT_SEED_PASSWORD,
  JWT_EXPIRES_IN,
  JWT_REMEMBER_EXPIRES_IN,
  JWT_SECRET,
} from '../config/auth'
import { getDatabase } from '../config/database'
import type { TeamMember } from '../types'

export interface AuthMember extends TeamMember {
  password: string
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
    `SELECT id, name, email, role, color, password FROM members WHERE LOWER(email) = LOWER(?)`,
    [email.trim()]
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
