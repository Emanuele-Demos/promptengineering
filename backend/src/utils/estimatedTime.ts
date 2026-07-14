export const WORK_DAY_MINUTES = 480
export const WORK_WEEK_MINUTES = 2400
export const MAX_ESTIMATED_MINUTES = 10_000

export function parseEstimatedTime(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null

  const n = typeof value === 'number' ? value : parseInt(String(value), 10)
  if (!Number.isInteger(n)) {
    throw new Error('Il tempo stimato deve essere un numero intero')
  }
  if (n <= 0) {
    throw new Error('Il tempo stimato deve essere maggiore di zero')
  }
  if (n > MAX_ESTIMATED_MINUTES) {
    throw new Error(`Il tempo stimato non può superare ${MAX_ESTIMATED_MINUTES} minuti`)
  }
  return n
}

export function formatEstimatedTimeLong(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0 minuti'

  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  const parts: string[] = []

  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'ora' : 'ore'}`)
  }
  if (mins > 0) {
    parts.push(`${mins} minut${mins === 1 ? 'o' : 'i'}`)
  }

  return parts.join(' ')
}
