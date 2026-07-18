import { getInitials } from '../utils/helpers'
import { resolveUserAvatarSrc, type UserAvatarSelection } from '../utils/userAvatar'

interface MemberAvatarProps {
  name: string
  color: string
  size?: 'sm' | 'md' | 'lg'
  avatar?: UserAvatarSelection | null
}

const sizes = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
}

export function MemberAvatar({ name, color, size = 'md', avatar = null }: MemberAvatarProps) {
  const avatarSrc = resolveUserAvatarSrc(avatar)

  return (
    <div
      className={`${sizes[size]} relative overflow-hidden rounded-full flex items-center justify-center font-semibold text-white shrink-0 ring-2 ring-white`}
      style={{ backgroundColor: color }}
      title={name}
    >
      {avatarSrc ? (
        <img src={avatarSrc} alt={`Avatar ${name}`} className="h-full w-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  )
}
