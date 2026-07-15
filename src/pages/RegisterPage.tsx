import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Briefcase, Loader2, Shield, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { PasswordInput } from '../components/auth/PasswordInput'
import { PasswordStrength } from '../components/auth/PasswordStrength'
import { TermsCheckbox } from '../components/auth/TermsCheckbox'
import { isPasswordValid, PASSWORD_POLICY_MESSAGE } from '../utils/passwordPolicy'
import {
  COMPANY_ROLES,
  ONBOARDING_TASK_PREVIEW,
  type CompanyRole,
} from '../data/companyRoles'

const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'Nome obbligatorio')
      .min(2, 'Nome troppo corto')
      .regex(/^[\p{L}\s'-]+$/u, 'Nome non valido'),
    role: z
      .string()
      .min(1, 'Seleziona un ruolo aziendale')
      .refine((v): v is CompanyRole => (COMPANY_ROLES as readonly string[]).includes(v), {
        message: 'Ruolo aziendale non valido',
      }),
    username: z
      .string()
      .regex(/^[a-zA-Z0-9_]{3,30}$/, 'Username non valido (3-30 caratteri, lettere, numeri e _)')
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(1, 'Password obbligatoria')
      .refine(isPasswordValid, PASSWORD_POLICY_MESSAGE),
    confirmPassword: z.string().min(1, 'Conferma password obbligatoria'),
    acceptTerms: z.boolean().refine((v) => v === true, {
      message: 'Devi accettare i termini per registrarti',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Le password non coincidono',
    path: ['confirmPassword'],
  })

type RegisterFormValues = {
  firstName: string
  role: CompanyRole | ''
  username?: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
}

const inputClass = (hasError: boolean) =>
  `w-full rounded-xl border bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 ${
    hasError ? 'border-red-300' : 'border-slate-200'
  }`

export function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema) as Resolver<RegisterFormValues>,
    defaultValues: {
      firstName: '',
      role: '',
      username: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  })

  const passwordValue = watch('password') ?? ''
  const selectedRole = watch('role') as CompanyRole | undefined

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null)
    setSuccessMessage(null)

    try {
      const result = await registerUser({
        firstName: values.firstName,
        role: values.role as CompanyRole,
        username: values.username || undefined,
        password: values.password,
      })

      setSuccessMessage(result.message)

      if (result.autoLoggedIn) {
        navigate('/', { replace: true })
      } else {
        setTimeout(() => navigate('/login', { replace: true }), 1500)
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Errore durante la registrazione'
      setServerError(message)
    }
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-[480px] login-card-enter">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/25 mb-4">
              <Zap className="w-7 h-7 text-white" aria-hidden />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Crea il tuo account</h1>
            <p className="text-slate-500 mt-1">Unisciti a TeamFlow</p>
          </div>

          {serverError && (
            <div
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {serverError}
            </div>
          )}

          {successMessage && (
            <div
              className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              role="status"
            >
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1.5">
                Nome
              </label>
              <input
                id="firstName"
                autoComplete="given-name"
                aria-invalid={Boolean(errors.firstName)}
                className={inputClass(Boolean(errors.firstName))}
                placeholder="Mario"
                {...register('firstName')}
              />
              {errors.firstName && (
                <p className="mt-1.5 text-sm text-red-600" role="alert">
                  {errors.firstName.message}
                </p>
              )}
              <p className="mt-1.5 text-xs text-slate-400 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" aria-hidden />
                Cognome casuale e email istituzionale nome.cognome@team.it
              </p>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1.5">
                Ruolo in azienda
              </label>
              <div className="relative">
                <Briefcase
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
                  aria-hidden
                />
                <select
                  id="role"
                  aria-invalid={Boolean(errors.role)}
                  className={`${inputClass(Boolean(errors.role))} pl-10 appearance-none`}
                  {...register('role')}
                >
                  <option value="" disabled>
                    Seleziona il tuo ruolo
                  </option>
                  {COMPANY_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              {errors.role && (
                <p className="mt-1.5 text-sm text-red-600" role="alert">
                  {errors.role.message}
                </p>
              )}
              {selectedRole && (
                <p className="mt-2 text-xs text-indigo-600 bg-indigo-50 rounded-lg px-3 py-2">
                  Task di benvenuto: {ONBOARDING_TASK_PREVIEW[selectedRole]}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1.5">
                Username <span className="text-slate-400 font-normal">(opzionale)</span>
              </label>
              <input
                id="username"
                autoComplete="username"
                aria-invalid={Boolean(errors.username)}
                className={inputClass(Boolean(errors.username))}
                placeholder="mrossi"
                {...register('username')}
              />
              {errors.username && (
                <p className="mt-1.5 text-sm text-red-600" role="alert">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <PasswordInput
                id="password"
                label="Password"
                autoComplete="new-password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />
              <div className="mt-3">
                <PasswordStrength password={passwordValue} />
              </div>
            </div>

            <PasswordInput
              id="confirmPassword"
              label="Conferma Password"
              autoComplete="new-password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <TermsCheckbox error={errors.acceptTerms?.message} {...register('acceptTerms')} />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:shadow-indigo-600/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                  Registrazione in corso...
                </>
              ) : (
                'Registrati'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500 mb-3">Hai già un account?</p>
            <Link
              to="/login"
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Accedi
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
