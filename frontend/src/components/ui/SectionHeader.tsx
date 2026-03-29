type Props = {
  title: string
  subtitle?: string
  right?: React.ReactNode
}

export function SectionHeader({ title, subtitle, right }: Props) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm md:text-base text-stone-600 max-w-2xl">{subtitle}</p>
        ) : null}
      </div>
      {right ? <div className="pt-1">{right}</div> : null}
    </div>
  )
}

