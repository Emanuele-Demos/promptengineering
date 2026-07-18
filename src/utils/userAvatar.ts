export type UserAvatarSelection =
  | { type: 'preset'; value: string }
  | { type: 'image'; value: string }

export interface ProfessionalAvatarPreset {
  id: string
  label: string
  src: string
}

const AVATAR_KEY_PREFIX = 'teamflow-avatar:'

function buildProfessionalAvatarSvg(accent: string, jacket: string, shirt: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="Avatar professionale"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${accent}"/><stop offset="100%" stop-color="#0f172a"/></linearGradient></defs><rect width="120" height="120" fill="url(#bg)"/><circle cx="60" cy="44" r="20" fill="#f1d0b5"/><path d="M22 120c4-24 20-40 38-40s34 16 38 40" fill="${jacket}"/><path d="M46 120l14-20 14 20" fill="${shirt}"/><path d="M40 34c2-12 10-18 20-18s18 6 20 18c-5-4-11-6-20-6s-15 2-20 6" fill="#1e293b"/></svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export const PROFESSIONAL_AVATAR_PRESETS: ProfessionalAvatarPreset[] = [
  {
    id: 'exec-navy',
    label: 'Executive Navy',
    src: buildProfessionalAvatarSvg('#1d4ed8', '#0f172a', '#e2e8f0'),
  },
  {
    id: 'consultant-slate',
    label: 'Consultant Slate',
    src: buildProfessionalAvatarSvg('#334155', '#1e293b', '#f8fafc'),
  },
  {
    id: 'manager-steel',
    label: 'Manager Steel',
    src: buildProfessionalAvatarSvg('#0369a1', '#0f172a', '#dbeafe'),
  },
  {
    id: 'analyst-charcoal',
    label: 'Analyst Charcoal',
    src: buildProfessionalAvatarSvg('#475569', '#111827', '#e5e7eb'),
  },
  {
    id: 'director-cobalt',
    label: 'Director Cobalt',
    src: buildProfessionalAvatarSvg('#1e3a8a', '#1f2937', '#dbeafe'),
  },
  {
    id: 'advisor-teal',
    label: 'Advisor Teal',
    src: buildProfessionalAvatarSvg('#0f766e', '#134e4a', '#ccfbf1'),
  },
]

const professionalAvatarPresetMap = new Map(
  PROFESSIONAL_AVATAR_PRESETS.map((preset) => [preset.id, preset.src]),
)

function getAvatarKey(userId: number | string): string {
  return `${AVATAR_KEY_PREFIX}${userId}`
}

export function getUserAvatar(userId: number | string): UserAvatarSelection | null {
  const raw = localStorage.getItem(getAvatarKey(userId))
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as UserAvatarSelection
    if (!parsed || (parsed.type !== 'preset' && parsed.type !== 'image')) return null
    if (typeof parsed.value !== 'string' || !parsed.value.trim()) return null
    return parsed
  } catch {
    return null
  }
}

export function saveUserAvatar(userId: number | string, avatar: UserAvatarSelection): void {
  localStorage.setItem(getAvatarKey(userId), JSON.stringify(avatar))
}

export function clearUserAvatar(userId: number | string): void {
  localStorage.removeItem(getAvatarKey(userId))
}

export function resolveUserAvatarSrc(avatar: UserAvatarSelection | null): string | null {
  if (!avatar) return null
  if (avatar.type === 'image') return avatar.value

  return professionalAvatarPresetMap.get(avatar.value) ?? null
}