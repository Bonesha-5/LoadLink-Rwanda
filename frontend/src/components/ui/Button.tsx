import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: Variant
  size?: Size
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-sidebar text-white hover:bg-sidebar/95 border border-sidebar/10 shadow-sm hover:shadow-md',
  secondary: 'bg-white text-stone-900 hover:bg-stone-50 border border-stone-200',
  ghost: 'bg-transparent text-stone-700 hover:bg-stone-100 border border-transparent',
  danger: 'bg-red-600 text-white hover:bg-red-700 border border-red-600/20 shadow-sm',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-xl',
  md: 'h-11 px-4 text-sm rounded-2xl',
}

export function Button({
  children,
  className,
  variant = 'secondary',
  size = 'md',
  ...props
}: Props) {
  return (
    <button
      {...props}
      className={[
        'inline-flex items-center justify-center gap-2 font-semibold',
        'transition-all duration-200 ease-out active:scale-[0.99]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2',
        sizeClasses[size],
        variantClasses[variant],
        className ?? '',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

