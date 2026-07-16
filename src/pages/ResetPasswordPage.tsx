import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, KeyRound, Loader2 } from 'lucide-react'
import { resetPassword } from '../api/auth'
import { PasswordInput } from '../components/auth/PasswordInput'
import { PasswordStrength } from '../components/auth/PasswordStrength'
import { isPasswordValid, PASSWORD_POLICY_MESSAGE } from '../utils/passwordPolicy'

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Password obbligatoria')
      .refine(isPasswordValid, PASSWORD_POLICY_MESSAGE),
    confirmPassword: z.string().min(1, 'Conferma password obbligatoria'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Le password non coincidono',
    path: ['confirmPassword'],
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const passwordValue = watch('password')

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setServerError(null)

    if (!token) {
      setServerError('Link di reimpostazione non valido o scaduto')
      return
    }

    try {
      await resetPassword({ token, password: values.password })
      navigate('/login', {
        replace: true,
        state: { passwordReset: true },
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Errore durante la reimpostazione'
      setServerError(message)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-[480px] bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100 mb-4">
            <KeyRound className="w-7 h-7 text-red-600" aria-hidden />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Link non valido</h1>
          <p className="text-slate-500 mt-2 text-sm">
            Il link di reimpostazione è mancante, scaduto o già utilizzato.
          </p>
          <Link
            to="/password-dimenticata"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Richiedi un nuovo link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] login-card-enter">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/25 mb-4">
              <KeyRound className="w-7 h-7 text-white" aria-hidden />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Nuova password</h1>
            <p className="text-slate-500 mt-1">Scegli una password sicura per il tuo account</p>
          </div>

          {serverError && (
            <div
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div>
              <PasswordInput
                id="password"
                label="Nuova password"
                placeholder="••••••••"
                autoComplete="new-password"
                error={errors.password?.message}
                {...register('password')}
              />
              <PasswordStrength password={passwordValue} />
            </div>

            <PasswordInput
              id="confirmPassword"
              label="Conferma password"
              placeholder="••••••••"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:shadow-indigo-600/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                  Salvataggio...
                </>
              ) : (
                'Reimposta password'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Torna al login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
