import type { AuthUser } from './auth.d.ts'

export const AUTH_TOKEN_KEY: string
export const AUTH_USER_KEY: string
export const USER_ID_KEY: string
export const REMEMBER_KEY: string

export function getRememberMe(): boolean
export function getAuthToken(): string | null
export function loadStoredUser(): AuthUser | null
export function saveAuth(params: {
  token: string
  user: AuthUser
  rememberMe: boolean
}): void
export function clearAuth(): void
export function authHeaders(extra?: Record<string, string>): Record<string, string>
