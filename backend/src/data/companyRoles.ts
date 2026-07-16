export const COMPANY_ROLES = [
  'Project Manager',
  'Developer',
  'Designer',
  'QA Engineer',
] as const

export type CompanyRole = (typeof COMPANY_ROLES)[number]

export interface OnboardingTaskTemplate {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  tags: string[]
}

export const ONBOARDING_BY_ROLE: Record<CompanyRole, OnboardingTaskTemplate> = {
  'Project Manager': {
    title: 'Definire priorità e obiettivi del trimestre',
    description:
      'Allinea il team sulle milestone principali e prepara la roadmap del periodo.',
    priority: 'high',
    tags: ['onboarding', 'planning'],
  },
  Developer: {
    title: 'Configurare l\'ambiente e completare la prima user story',
    description:
      'Clona il repository, configura l\'ambiente locale e porta a termine la prima attività di sviluppo assegnata.',
    priority: 'high',
    tags: ['onboarding', 'backend'],
  },
  Designer: {
    title: 'Revisione UI/UX e proposta miglioramenti',
    description:
      'Analizza dashboard e board, individua criticità visive e prepara wireframe per le prossime iterazioni.',
    priority: 'medium',
    tags: ['onboarding', 'design'],
  },
  'QA Engineer': {
    title: 'Eseguire test di smoke sulle funzionalità principali',
    description:
      'Verifica login, registrazione, task, board e notifiche. Documenta eventuali anomalie.',
    priority: 'medium',
    tags: ['onboarding', 'testing'],
  },
}

export function isCompanyRole(value: string): value is CompanyRole {
  return (COMPANY_ROLES as readonly string[]).includes(value)
}
