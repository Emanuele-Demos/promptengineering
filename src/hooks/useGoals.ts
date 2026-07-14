import { useCallback, useEffect, useState } from 'react'
import { getGoals, getGoalHistory } from '../api/goals.js'
import type { GoalHistory, GoalWithProgress, GoalType } from '../types'

const POLL_MS = 15_000

export function useGoals() {
  const [goals, setGoals] = useState<GoalWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setError('')
    try {
      const data = (await getGoals()) as GoalWithProgress[]
      setGoals(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, POLL_MS)
    return () => clearInterval(interval)
  }, [refresh])

  const daily = goals.find((g) => g.type === 'daily')
  const weekly = goals.find((g) => g.type === 'weekly')

  return { goals, daily, weekly, loading, error, refresh }
}

export function useGoalHistory(filter?: GoalType) {
  const [history, setHistory] = useState<GoalHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = (await getGoalHistory(filter)) as GoalHistory[]
      setHistory(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { history, loading, error, refresh }
}
