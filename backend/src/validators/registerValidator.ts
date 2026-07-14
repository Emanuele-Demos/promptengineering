import { validatePasswordPolicy } from '../utils/passwordPolicy'
import { isInstitutionalEmail, INSTITUTIONAL_EMAIL_MESSAGE } from '../utils/institutionalEmail'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/
const NAME_REGEX = /^[\p{L}\s'-]+$/u

export interface RegisterInput {
  firstName: string
  lastName: string
  username?: string
  email: string
  password: string
}

function sanitizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function validateRegisterInput(body: unknown): RegisterInput {
  if (!body || typeof body !== 'object') {
    throw new Error('Dati di registrazione non validi')
  }

  const { firstName, lastName, username, email, password } = body as Record<string, unknown>

  if (typeof firstName !== 'string' || !firstName.trim()) {
    throw new Error('Nome obbligatorio')
  }

  if (typeof lastName !== 'string' || !lastName.trim()) {
    throw new Error('Cognome obbligatorio')
  }

  const cleanFirst = sanitizeName(firstName)
  const cleanLast = sanitizeName(lastName)

  if (cleanFirst.length < 2 || !NAME_REGEX.test(cleanFirst)) {
    throw new Error('Nome non valido')
  }

  if (cleanLast.length < 2 || !NAME_REGEX.test(cleanLast)) {
    throw new Error('Cognome non valido')
  }

  if (typeof email !== 'string' || !email.trim()) {
    throw new Error('Email obbligatoria')
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    throw new Error('Email non valida')
  }

  if (!isInstitutionalEmail(email)) {
    throw new Error(INSTITUTIONAL_EMAIL_MESSAGE)
  }

  if (typeof password !== 'string' || !password) {
    throw new Error('Password obbligatoria')
  }

  const passwordError = validatePasswordPolicy(password)
  if (passwordError) {
    throw new Error(passwordError)
  }

  let cleanUsername: string | undefined
  if (username !== undefined && username !== null && username !== '') {
    if (typeof username !== 'string') {
      throw new Error('Username non valido')
    }
    cleanUsername = username.trim().toLowerCase()
    if (!USERNAME_REGEX.test(cleanUsername)) {
      throw new Error('Username non valido (3-30 caratteri, lettere, numeri e _)')
    }
  }

  return {
    firstName: cleanFirst,
    lastName: cleanLast,
    username: cleanUsername,
    email: email.trim().toLowerCase(),
    password,
  }
}
