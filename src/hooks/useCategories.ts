import { useCallback, useEffect, useState } from 'react'
import { getCategories } from '../api/api.js'
import type { Category } from '../types'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = (await getCategories()) as Category[]
      setCategories(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const getCategoryById = useCallback(
    (id: string | null | undefined) =>
      id ? categories.find((category) => category.id === id) : undefined,
    [categories],
  )

  return { categories, loading, error, refresh, getCategoryById }
}
