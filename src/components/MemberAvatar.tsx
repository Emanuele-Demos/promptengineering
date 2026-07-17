import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { getInitials } from '../utils/helpers'
import { resolveAvatarUrl } from '../utils/avatarUrl'

interface MemberAvatarProps {
  name: string
  color: string
  avatarUrl?: string | null
  cacheKey?: string | number | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
}

const sizes = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-20 h-20 text-lg',
}

export function MemberAvatar({
  name,
  color,
  avatarUrl,
  cacheKey,
  size = 'md',
  loading = false,
}: MemberAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const src = !imageFailed ? resolveAvatarUrl(avatarUrl, cacheKey) : null

  return (
    <div
      className={`relative ${sizes[size]} rounded-full shrink-0 ring-2 ring-white overflow-hidden`}
      title={name}
    >
      {src ? (
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          {getInitials(name)}
        </div>
      )}

      {loading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-slate-900/50"
          aria-hidden
        >
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        </div>
      )}
    </div>
  )
}
