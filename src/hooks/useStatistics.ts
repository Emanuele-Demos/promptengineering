import { useCallback, useEffect, useRef, useState } from 'react'
import { getStatistics } from '../api/statistics.js'
import type { StatisticsData, StatisticsFilter } from '../types'

const POLL_MS = 20_000

interface UseStatisticsOptions {
  filter?: StatisticsFilter
  from?: string
  to?: string
}

export function useStatistics(options: UseStatisticsOptions = {}) {
  const { filter = '7d', from, to } = options
  const [data, setData] = useState<StatisticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const hasLoadedRef = useRef(false)

  const refresh = useCallback(async () => {
    setError('')
    if (hasLoadedRef.current) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const result = (await getStatistics({ filter, from, to })) as StatisticsData
      setData(result)
      hasLoadedRef.current = true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filter, from, to])

  useEffect(() => {
    hasLoadedRef.current = false
    refresh()
    const interval = setInterval(refresh, POLL_MS)
    return () => clearInterval(interval)
  }, [refresh])

  return { data, loading, refreshing, error, refresh }
}
