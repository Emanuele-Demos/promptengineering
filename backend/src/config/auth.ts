export const JWT_SECRET = process.env.JWT_SECRET || 'teamflow-dev-secret-change-in-production'
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'
export const JWT_REMEMBER_EXPIRES_IN = process.env.JWT_REMEMBER_EXPIRES_IN || '7d'
export const DEFAULT_SEED_PASSWORD = process.env.DEFAULT_SEED_PASSWORD || 'Password123'
export const BCRYPT_ROUNDS = 10
