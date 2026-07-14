export const PASSWORD_MIN_LENGTH = 8

export interface PasswordRequirement {
  id: string
  label: string
  test: (password: string) => boolean
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: 'length',
    label: `Almeno ${PASSWORD_MIN_LENGTH} caratteri`,
    test: (p) => p.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: 'uppercase',
    label: 'Almeno una lettera maiuscola',
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: 'lowercase',
    label: 'Almeno una lettera minuscola',
    test: (p) => /[a-z]/.test(p),
  },
  {
    id: 'number',
    label: 'Almeno un numero',
    test: (p) => /\d/.test(p),
  },
  {
    id: 'special',
    label: 'Almeno un carattere speciale',
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
]

export function getPasswordStrength(password: string): {
  score: number
  label: 'Debole' | 'Discreta' | 'Buona' | 'Forte'
  color: string
} {
  if (!password) return { score: 0, label: 'Debole', color: 'bg-slate-200' }

  const passed = PASSWORD_REQUIREMENTS.filter((r) => r.test(password)).length
  const ratio = passed / PASSWORD_REQUIREMENTS.length

  if (ratio <= 0.4) return { score: 25, label: 'Debole', color: 'bg-red-500' }
  if (ratio <= 0.6) return { score: 50, label: 'Discreta', color: 'bg-orange-400' }
  if (ratio <= 0.8) return { score: 75, label: 'Buona', color: 'bg-yellow-400' }
  return { score: 100, label: 'Forte', color: 'bg-emerald-500' }
}

export function isPasswordValid(password: string): boolean {
  return PASSWORD_REQUIREMENTS.every((r) => r.test(password))
}

export const PASSWORD_POLICY_MESSAGE =
  'La password deve contenere almeno 8 caratteri, una maiuscola, una minuscola, un numero e un carattere speciale'
