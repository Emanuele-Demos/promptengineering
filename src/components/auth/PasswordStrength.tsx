import { Check, X } from 'lucide-react'
import { getPasswordStrength, PASSWORD_REQUIREMENTS } from '../../utils/passwordPolicy'

interface PasswordStrengthProps {
  password: string
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = getPasswordStrength(password)

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
            style={{ width: `${strength.score}%` }}
          />
        </div>
        <span className="text-xs font-medium text-slate-500 shrink-0">{strength.label}</span>
      </div>
      <ul className="space-y-1">
        {PASSWORD_REQUIREMENTS.map((req) => {
          const ok = req.test(password)
          return (
            <li
              key={req.id}
              className={`flex items-center gap-2 text-xs ${
                ok ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              {ok ? (
                <Check className="w-3.5 h-3.5 shrink-0" aria-hidden />
              ) : (
                <X className="w-3.5 h-3.5 shrink-0" aria-hidden />
              )}
              {req.label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
