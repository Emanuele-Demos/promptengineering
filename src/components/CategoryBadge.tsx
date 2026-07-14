import type { Category } from '../types'

interface CategoryBadgeProps {
  category: Pick<Category, 'name' | 'color'>
  className?: string
}

export function CategoryBadge({ category, className = '' }: CategoryBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white shrink-0 ${className}`}
      style={{ backgroundColor: category.color }}
      title={category.name}
    >
      <span
        className="w-1.5 h-1.5 rounded-full bg-white/90 shrink-0"
        aria-hidden
      />
      {category.name}
    </span>
  )
}
