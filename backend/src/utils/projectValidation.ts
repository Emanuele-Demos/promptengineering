export function sanitizeProjectName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

export function validateProjectInput(
  name: unknown,
  description: unknown
): { name: string; description: string } {
  if (typeof name !== 'string' || !sanitizeProjectName(name)) {
    throw new Error('Il nome del progetto è obbligatorio')
  }
  const desc = typeof description === 'string' ? description.trim() : ''
  return { name: sanitizeProjectName(name), description: desc }
}

export function computeProjectProgress(totalTasks: number, completedTasks: number): number {
  if (totalTasks <= 0) return 0
  return Math.round((completedTasks / totalTasks) * 100)
}
