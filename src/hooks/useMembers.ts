import { useCallback, useEffect, useState } from 'react'
import {
  createMember as createMemberApi,
  deleteMember as deleteMemberApi,
  getMembers,
  updateMember as updateMemberApi,
} from '../api/members.js'
import type { TeamMember } from '../types'
import { MEMBER_COLORS } from '../types'

function pickColor(index: number): string {
  return MEMBER_COLORS[index % MEMBER_COLORS.length]
}

export function useMembers() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const refresh = useCallback(async () => {
    setError('')
    try {
      const data = (await getMembers()) as TeamMember[]
      setMembers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    refresh()
  }, [refresh])

  const createMember = useCallback(
    async (input: Omit<TeamMember, 'id' | 'color'>) => {
      setSaving(true)
      setError('')
      try {
        await createMemberApi({
          ...input,
          role: input.role.trim() || 'User',
          color: pickColor(members.length),
        })
        await refresh()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Errore imprevisto'
        setError(message)
        throw err
      } finally {
        setSaving(false)
      }
    },
    [members.length, refresh],
  )

  const updateMember = useCallback(
    async (id: number, updates: Partial<Omit<TeamMember, 'id'>>) => {
      const existing = members.find((m) => m.id === id)
      if (!existing) return

      setSaving(true)
      setError('')
      try {
        await updateMemberApi(id, {
          name: updates.name?.trim() ?? existing.name,
          email: updates.email?.trim() ?? existing.email,
          role: updates.role?.trim() ?? existing.role,
          color: updates.color ?? existing.color,
        })
        await refresh()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Errore imprevisto'
        setError(message)
        throw err
      } finally {
        setSaving(false)
      }
    },
    [members, refresh],
  )

  const deleteMember = useCallback(
    async (id: number) => {
      setSaving(true)
      setError('')
      try {
        await deleteMemberApi(id)
        await refresh()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Errore imprevisto'
        setError(message)
        throw err
      } finally {
        setSaving(false)
      }
    },
    [refresh],
  )

  return {
    members,
    loading,
    error,
    saving,
    refresh,
    createMember,
    updateMember,
    deleteMember,
  }
}
