import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
}

export function Badge({ children, className }: Props) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
        'bg-stone-100 text-stone-700 border border-stone-200',
        'transition-colors duration-200',
        className ?? '',
      ].join(' ')}
    >
      {children}
    </span>
  )
}

