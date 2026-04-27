import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export function Badge({
  children,
  tone = 'slate',
  className,
}: {
  children: ReactNode
  tone?: 'slate' | 'emerald' | 'sky' | 'amber' | 'red' | 'violet'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        tone === 'slate' && 'border-slate-200 bg-slate-100 text-slate-700',
        tone === 'emerald' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
        tone === 'sky' && 'border-sky-200 bg-sky-50 text-sky-700',
        tone === 'amber' && 'border-amber-200 bg-amber-50 text-amber-700',
        tone === 'red' && 'border-red-200 bg-red-50 text-red-700',
        tone === 'violet' && 'border-violet-200 bg-violet-50 text-violet-700',
        className,
      )}
    >
      {children}
    </span>
  )
}
