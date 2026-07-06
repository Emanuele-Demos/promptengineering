import { getInitials } from '../utils/helpers'

interface MemberAvatarProps {
  name: string
  color: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
}

export function MemberAvatar({ name, color, size = 'md' }: MemberAvatarProps) {
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white shrink-0 ring-2 ring-white`}
      style={{ backgroundColor: color }}
      title={name}
    >
      {getInitials(name)}
    </div>
  )
}
