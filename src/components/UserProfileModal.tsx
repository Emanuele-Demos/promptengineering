import { useEffect, useState } from 'react'
import { LogOut, X } from 'lucide-react'
import type { AuthUser } from '../api/auth.d.ts'
import { MemberAvatar } from './MemberAvatar'
import { getUserAvatar, type UserAvatarSelection } from '../utils/userAvatar'

interface UserProfileModalProps {
  user: AuthUser
  open: boolean
  onClose: () => void
  onLogout: () => void
}

function resolveNames(user: AuthUser): { firstName: string; lastName: string } {
  if (user.firstName) {
    return {
      firstName: user.firstName,
      lastName: user.lastName || '—',
    }
  }

  const parts = user.name.trim().split(/\s+/)
  return {
    firstName: parts[0] ?? user.name,
    lastName: parts.slice(1).join(' ') || '—',
  }
}

export function UserProfileModal({ user, open, onClose, onLogout }: UserProfileModalProps) {
  const [avatar, setAvatar] = useState<UserAvatarSelection | null>(null)

  useEffect(() => {
    const syncAvatar = () => setAvatar(getUserAvatar(user.id))
    syncAvatar()
    window.addEventListener('teamflow-avatar-updated', syncAvatar)
    return () => window.removeEventListener('teamflow-avatar-updated', syncAvatar)
  }, [user.id])

  if (!open) return null

  const { firstName, lastName } = resolveNames(user)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-profile-title"
        className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200">
          <h2 id="user-profile-title" className="text-lg font-bold text-slate-900">
            Il tuo profilo
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-4">
            <MemberAvatar name={user.name} color={user.color} size="lg" avatar={avatar} />
            <div>
              <p className="text-base font-semibold text-slate-900">{user.name}</p>
              <p className="text-sm text-indigo-600">{user.role}</p>
            </div>
          </div>

          <dl className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nome</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{firstName}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Cognome</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{lastName}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Ruolo</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{user.role}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Email</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900 break-all">{user.email}</dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-700 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Esci dall&apos;account
          </button>
        </div>
      </div>
    </div>
  )
}
