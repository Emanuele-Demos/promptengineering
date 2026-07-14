import { useCallback, useEffect, useState } from 'react'
import { getProjects } from '../api/projects.js'
import type { Project } from '../types'

export function useProjects(search?: string) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setError('')
    try {
      const data = (await getProjects(search)) as Project[]
      setProjects(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    setLoading(true)
    refresh()
  }, [refresh])

  const getProjectById = useCallback(
    (id: string | null | undefined) =>
      id ? projects.find((project) => project.id === id) : undefined,
    [projects]
  )

  return { projects, loading, error, refresh, getProjectById }
}
