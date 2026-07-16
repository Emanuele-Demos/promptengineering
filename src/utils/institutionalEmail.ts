export const INSTITUTIONAL_EMAIL_DOMAIN = 'team.it'

export const INSTITUTIONAL_EMAIL_REGEX = /^[^\s@]+@team\.it$/i

export const INSTITUTIONAL_EMAIL_MESSAGE =
  'È consentita solo un\'email istituzionale @team.it'

export function isInstitutionalEmail(email: string): boolean {
  return INSTITUTIONAL_EMAIL_REGEX.test(email.trim())
}
