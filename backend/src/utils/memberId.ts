import { getParam } from './params'

export function parseMemberId(value: string | string[] | undefined): number | null {
  const raw = value === undefined ? '' : getParam(value)
  const parsed = Number.parseInt(raw, 10)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }
  return parsed
}

export function parseOptionalMemberId(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value
  }
  if (typeof value === 'string') {
    return parseMemberId(value)
  }
  return null
}

export function parseUserIdFromTokenSub(sub: unknown): number | null {
  if (typeof sub === 'number' && Number.isInteger(sub) && sub > 0) {
    return sub
  }
  if (typeof sub === 'string' && sub.trim()) {
    return parseMemberId(sub)
  }
  return null
}
