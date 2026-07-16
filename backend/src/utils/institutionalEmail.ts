export const INSTITUTIONAL_EMAIL_DOMAIN = 'team.it'

export const INSTITUTIONAL_EMAIL_REGEX = /^[^\s@]+@team\.it$/i

export const INSTITUTIONAL_EMAIL_MESSAGE =
  'È consentita solo un\'email istituzionale @team.it'

export function normalizeEmailPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

export function buildInstitutionalEmail(firstName: string, lastName: string): string {
  const first = normalizeEmailPart(firstName)
  const last = normalizeEmailPart(lastName)
  return `${first}.${last}@${INSTITUTIONAL_EMAIL_DOMAIN}`
}

export function isInstitutionalEmail(email: string): boolean {
  return INSTITUTIONAL_EMAIL_REGEX.test(email.trim())
}
