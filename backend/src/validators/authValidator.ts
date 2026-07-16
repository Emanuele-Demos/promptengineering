const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface LoginInput {
  email: string
  password: string
  rememberMe?: boolean
}

export function validateLoginInput(body: unknown): LoginInput {
  if (!body || typeof body !== 'object') {
    throw new Error('Dati di login non validi')
  }

  const { email, password, rememberMe } = body as Record<string, unknown>

  if (typeof email !== 'string' || !email.trim()) {
    throw new Error('Email obbligatoria')
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    throw new Error('Email non valida')
  }

  if (typeof password !== 'string' || !password) {
    throw new Error('Password obbligatoria')
  }

  if (password.length < 8) {
    throw new Error('La password deve contenere almeno 8 caratteri')
  }

  return {
    email: email.trim().toLowerCase(),
    password,
    rememberMe: rememberMe === true,
  }
}
