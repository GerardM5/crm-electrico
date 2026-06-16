import { ChevronDown } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../../lib/utils'

const inputBase =
  'focus-ring flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50'

export function Field({
  label,
  error,
  hint,
  required,
  className,
  children,
}: {
  label: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <label className={cn('grid gap-1.5 text-sm font-medium text-foreground', className)}>
      <span className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive" aria-hidden>*</span>}
      </span>
      {children}
      {hint && !error && <span className="text-xs text-muted-foreground">{hint}</span>}
      {error && <span className="text-xs font-medium text-destructive">{error}</span>}
    </label>
  )
}

/** Wraps an Input or Select with optional leading/trailing icon slots */
export function InputGroup({
  children,
  leading,
  trailing,
}: {
  children: ReactNode
  leading?: ReactNode
  trailing?: ReactNode
}) {
  return (
    <div className="relative">
      {leading && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground [&_svg]:size-4">
          {leading}
        </div>
      )}
      <div className={cn(leading && '[&_input]:pl-9 [&_select]:pl-9', trailing && '[&_input]:pr-9 [&_select]:pr-9')}>
        {children}
      </div>
      {trailing && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground [&_svg]:size-4">
          {trailing}
        </div>
      )}
    </div>
  )
}

export function Input({ className, ref, ...props }: ComponentProps<'input'>) {
  return <input ref={ref} className={cn(inputBase, 'h-9', className)} {...props} />
}

export function Textarea({ className, ref, ...props }: ComponentProps<'textarea'>) {
  return <textarea ref={ref} className={cn(inputBase, 'min-h-24 resize-none', className)} {...props} />
}

export function Select({ className, children, ref, ...props }: ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(inputBase, 'h-9 appearance-none pr-8', className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
    </div>
  )
}
