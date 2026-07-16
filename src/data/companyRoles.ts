export const COMPANY_ROLES = [
  'Project Manager',
  'Developer',
  'Designer',
  'QA Engineer',
] as const

export type CompanyRole = (typeof COMPANY_ROLES)[number]

export const ROLE_LABELS: Record<CompanyRole, string> = {
  'Project Manager': 'Project Manager',
  Developer: 'Developer',
  Designer: 'Designer',
  'QA Engineer': 'QA Engineer',
}

export const ONBOARDING_TASK_PREVIEW: Record<CompanyRole, string> = {
  'Project Manager': 'Definire priorità e obiettivi del trimestre',
  Developer: 'Configurare l\'ambiente e completare la prima user story',
  Designer: 'Revisione UI/UX e proposta miglioramenti',
  'QA Engineer': 'Eseguire test di smoke sulle funzionalità principali',
}
