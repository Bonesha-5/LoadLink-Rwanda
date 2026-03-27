import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: Props) {
  return (
    <div
      className={[
        'bg-white border border-stone-200 rounded-3xl shadow-sm',
        'transition-shadow duration-200 ease-out hover:shadow-md',
        className ?? '',
      ].join(' ')}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: Props) {
  return <div className={['px-6 pt-6', className ?? ''].join(' ')}>{children}</div>
}

export function CardBody({ children, className }: Props) {
  return <div className={['px-6 pb-6', className ?? ''].join(' ')}>{children}</div>
}

