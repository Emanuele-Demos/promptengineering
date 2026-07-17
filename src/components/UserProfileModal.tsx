import { useRef, useState, type ChangeEvent } from 'react'
import { Camera, Loader2, LogOut, X } from 'lucide-react'
import type { AuthUser } from '../api/auth.d.ts'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../store/AppContext'
import { MemberAvatar } from './MemberAvatar'

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
  const { uploadAvatar, removeAvatar } = useAuth()
  const { refreshData } = useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarCacheKey, setAvatarCacheKey] = useState(() => Date.now())

  if (!open) return null

  const { firstName, lastName } = resolveNames(user)
  const hasAvatar = Boolean(user.avatarUrl)
  const busy = uploading || removing

  const handlePickFile = () => {
    if (busy) return
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setError(null)
    setUploading(true)
    try {
      await uploadAvatar(file)
      setAvatarCacheKey(Date.now())
      await refreshData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il caricamento')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (busy || !hasAvatar) return

    setError(null)
    setRemoving(true)
    try {
      await removeAvatar()
      setAvatarCacheKey(Date.now())
      await refreshData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante la rimozione')
    } finally {
      setRemoving(false)
    }
  }

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
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handlePickFile}
                disabled={busy}
                className="relative group rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed"
                aria-label="Cambia foto profilo"
              >
                <MemberAvatar
                  name={user.name}
                  color={user.color}
                  avatarUrl={user.avatarUrl}
                  cacheKey={avatarCacheKey}
                  size="xl"
                  loading={uploading}
                />
                {!uploading && (
                  <span className="absolute bottom-0 right-0 flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white ring-2 ring-white shadow-sm">
                    <Camera className="w-3.5 h-3.5" />
                  </span>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />

              <button
                type="button"
                onClick={handlePickFile}
                disabled={busy}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-60"
              >
                Cambia foto
              </button>

              {hasAvatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={busy}
                  className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-60 inline-flex items-center gap-1.5"
                >
                  {removing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                      Rimozione...
                    </>
                  ) : (
                    'Rimuovi foto'
                  )}
                </button>
              )}
            </div>

            <div className="pt-2">
              <p className="text-base font-semibold text-slate-900">{user.name}</p>
              <p className="text-sm text-indigo-600">{user.role}</p>
            </div>
          </div>

          {error && (
            <div
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}

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
