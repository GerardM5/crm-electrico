import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export type BadgeTone = 'default' | 'secondary' | 'destructive' | 'outline' | 'emerald' | 'sky' | 'amber' | 'violet'

export function Badge({
  children,
  tone = 'default',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        tone === 'default' && 'border-transparent bg-primary text-primary-foreground',
        tone === 'secondary' && 'border-transparent bg-secondary text-secondary-foreground',
        tone === 'destructive' && 'border-transparent bg-destructive text-destructive-foreground',
        tone === 'outline' && 'border-border text-foreground',
        tone === 'emerald' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
        tone === 'sky' && 'border-sky-200 bg-sky-50 text-sky-700',
        tone === 'amber' && 'border-amber-200 bg-amber-50 text-amber-700',
        tone === 'violet' && 'border-violet-200 bg-violet-50 text-violet-700',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
