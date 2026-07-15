import { validatePasswordPolicy } from '../utils/passwordPolicy'

export interface ForgotPasswordInput {
  email: string
}

export interface ResetPasswordInput {
  token: string
  password: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateForgotPasswordInput(body: unknown): ForgotPasswordInput {
  if (!body || typeof body !== 'object') {
    throw new Error('Dati non validi')
  }

  const { email } = body as Record<string, unknown>

  if (typeof email !== 'string' || !email.trim()) {
    throw new Error('Email obbligatoria')
  }

  const cleanEmail = email.trim()

  if (!EMAIL_REGEX.test(cleanEmail)) {
    throw new Error('Email non valida')
  }

  return { email: cleanEmail }
}

export function validateResetPasswordInput(body: unknown): ResetPasswordInput {
  if (!body || typeof body !== 'object') {
    throw new Error('Dati non validi')
  }

  const { token, password } = body as Record<string, unknown>

  if (typeof token !== 'string' || !token.trim()) {
    throw new Error('Token di reimpostazione non valido')
  }

  if (typeof password !== 'string' || !password) {
    throw new Error('Password obbligatoria')
  }

  const passwordError = validatePasswordPolicy(password)
  if (passwordError) {
    throw new Error(passwordError)
  }

  return { token: token.trim(), password }
}
