import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Briefcase, ImagePlus, Mail, Palette, RotateCcw, UserCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  clearUserAvatar,
  getUserAvatar,
  saveUserAvatar,
  type UserAvatarSelection,
} from '../utils/userAvatar'

const AVATAR_PRESETS = ['🙂', '😎', '👩‍💻', '🧑‍💼', '👨‍💻', '🧠', '🚀', '🎯']

export function ProfilePage() {
  const { user } = useAuth()
  const [avatar, setAvatar] = useState<UserAvatarSelection | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const firstName = user?.firstName || user?.name?.split(' ')[0] || 'Non disponibile'
  const lastName = user?.lastName || user?.name?.split(' ').slice(1).join(' ') || 'Non disponibile'

  useEffect(() => {
    if (!user) return
    setAvatar(getUserAvatar(user.id))
  }, [user])

  const dispatchAvatarUpdate = () => {
    window.dispatchEvent(new CustomEvent('teamflow-avatar-updated'))
  }

  const onSelectPreset = (preset: string) => {
    if (!user) return
    const next: UserAvatarSelection = { type: 'preset', value: preset }
    saveUserAvatar(user.id, next)
    setAvatar(next)
    setUploadError('')
    dispatchAvatarUpdate()
  }

  const onResetAvatar = () => {
    if (!user) return
    clearUserAvatar(user.id)
    setAvatar(null)
    setUploadError('')
    dispatchAvatarUpdate()
  }

  const onUploadAvatar = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setUploadError('Seleziona un file immagine valido.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('L\'immagine deve essere al massimo 2MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : ''
      if (!src) {
        setUploadError('Impossibile leggere il file selezionato.')
        return
      }
      const next: UserAvatarSelection = { type: 'image', value: src }
      saveUserAvatar(user.id, next)
      setAvatar(next)
      setUploadError('')
      dispatchAvatarUpdate()
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profilo</h1>
          <p className="text-sm text-slate-500">Gestisci i dati principali del tuo account.</p>
        </div>
      </div>

      <div className="mx-auto w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-center gap-4 text-center md:justify-start md:text-left">
          <button
            type="button"
            onClick={() => setPickerOpen((prev) => !prev)}
            className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full text-xl font-semibold text-white ring-2 ring-indigo-200 transition hover:ring-indigo-400"
            style={{ backgroundColor: user?.color || '#6366f1' }}
            title="Cambia avatar"
          >
            {avatar?.type === 'image' ? (
              <img src={avatar.value} alt="Avatar utente" className="h-full w-full object-cover" />
            ) : avatar?.type === 'preset' ? (
              <span>{avatar.value}</span>
            ) : user?.name ? (
              user.name
                .split(' ')
                .map((part: string) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
            ) : (
              'U'
            )}
          </button>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{user?.name ?? 'Utente'}</h2>
            <p className="text-sm text-slate-500">Ruolo: {user?.role ?? 'Non disponibile'}</p>
            <p className="mt-1 text-xs text-slate-500">Clicca l'avatar per personalizzarlo</p>
          </div>
        </div>

        {pickerOpen && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">Scegli avatar</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {AVATAR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onSelectPreset(preset)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg hover:border-indigo-300 hover:shadow-sm"
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onUploadAvatar}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="app-action-button inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                Carica da galleria
              </button>
              <button
                type="button"
                onClick={onResetAvatar}
                className="app-action-button inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Ripristina iniziali
              </button>
            </div>

            {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <UserCircle2 className="h-4 w-4" />
              Nome
            </div>
            <p className="mt-2 text-sm text-slate-800">{firstName}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <UserCircle2 className="h-4 w-4" />
              Cognome
            </div>
            <p className="mt-2 text-sm text-slate-800">{lastName}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <UserCircle2 className="h-4 w-4" />
              Nome completo
            </div>
            <p className="mt-2 text-sm text-slate-800">{user?.name ?? 'Non disponibile'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Mail className="h-4 w-4" />
              Email
            </div>
            <p className="mt-2 text-sm text-slate-800">{user?.email ?? 'Non disponibile'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Briefcase className="h-4 w-4" />
              Ruolo
            </div>
            <p className="mt-2 text-sm text-slate-800">{user?.role ?? 'Non disponibile'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Palette className="h-4 w-4" />
              Tema pagina
            </div>
            <p className="mt-2 text-sm text-slate-800">Configuralo nelle impostazioni account.</p>
            <Link to="/settings" className="app-action-button mt-3 inline-flex rounded-lg border px-3 py-1.5 text-xs font-medium">
              Apri impostazioni
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
