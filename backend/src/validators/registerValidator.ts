import { validatePasswordPolicy } from '../utils/passwordPolicy'
import { isCompanyRole, type CompanyRole } from '../data/companyRoles'

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/
const NAME_REGEX = /^[\p{L}\s'-]+$/u

export interface RegisterInput {
  firstName: string
  role: CompanyRole
  username?: string
  password: string
}

function sanitizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function validateRegisterInput(body: unknown): RegisterInput {
  if (!body || typeof body !== 'object') {
    throw new Error('Dati di registrazione non validi')
  }

  const { firstName, role, username, password } = body as Record<string, unknown>

  if (typeof firstName !== 'string' || !firstName.trim()) {
    throw new Error('Nome obbligatorio')
  }

  const cleanFirst = sanitizeName(firstName)

  if (cleanFirst.length < 2 || !NAME_REGEX.test(cleanFirst)) {
    throw new Error('Nome non valido')
  }

  if (typeof role !== 'string' || !role.trim()) {
    throw new Error('Ruolo obbligatorio')
  }

  if (!isCompanyRole(role.trim())) {
    throw new Error('Ruolo aziendale non valido')
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
    role: role.trim() as CompanyRole,
    username: cleanUsername,
    password,
  }
}
