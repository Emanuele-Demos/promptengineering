export const JWT_SECRET = process.env.JWT_SECRET || 'teamflow-dev-secret-change-in-production'
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'
export const JWT_REMEMBER_EXPIRES_IN = process.env.JWT_REMEMBER_EXPIRES_IN || '7d'
export const DEFAULT_SEED_PASSWORD = process.env.DEFAULT_SEED_PASSWORD || 'Password123'
export const BCRYPT_ROUNDS = 10
export const AUTO_LOGIN_AFTER_REGISTER = process.env.AUTO_LOGIN_AFTER_REGISTER !== 'false'

export const MEMBER_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#14b8a6',
  '#0ea5e9',
  '#84cc16',
  '#ef4444',
] as const
