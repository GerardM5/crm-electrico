import { Check, ChevronsUpDown, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useDebounce } from '../../hooks/use-debounce'
import { cn } from '../../lib/utils'
import { useCustomer, useCustomers } from '../../services/customers.service'

interface Props {
  value: string
  onChange: (id: string) => void
  placeholder?: string
  clearLabel?: string
}

export function CustomerCombobox({
  value,
  onChange,
  placeholder = 'Buscar cliente…',
  clearLabel = 'Sin cliente',
}: Props) {
  const [open, setOpen] = useState(false)
  // User-typed text. `null` means the field is untouched, so the displayed
  // value is derived from the resolved customer instead.
  const [typedValue, setTypedValue] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Resolve the selected customer name (e.g. editing mode) — derived during
  // render, no effect needed.
  const { data: resolvedCustomer } = useCustomer(value || undefined)
  const inputValue = typedValue ?? (value ? resolvedCustomer?.name ?? '' : '')

  const debouncedQuery = useDebounce(open ? inputValue : '', 250)
  const { data } = useCustomers({ search: debouncedQuery || undefined, pageSize: 20 })
  const customers = data?.data ?? []

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        // Revert any unselected typing back to the derived value
        setTypedValue(null)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  function select(id: string, name: string) {
    onChange(id)
    setTypedValue(name)
    setOpen(false)
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
    setTypedValue('')
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          className="focus-ring flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm text-foreground shadow-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          value={inputValue}
          placeholder={placeholder}
          onChange={(e) => { setTypedValue(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        {value ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Quitar cliente"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        ) : (
          <ChevronsUpDown className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        )}
      </div>

      {open && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-md">
          <div className="max-h-60 overflow-auto p-1">
            <li>
              <button
                type="button"
                className="flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={() => { onChange(''); setTypedValue(''); setOpen(false) }}
              >
                {clearLabel}
              </button>
            </li>

            {customers.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground',
                    value === c.id && 'bg-accent/50',
                  )}
                  onClick={() => select(c.id, c.name)}
                >
                  <Check className={cn('size-4 shrink-0 text-primary', value === c.id ? 'opacity-100' : 'opacity-0')} />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium text-foreground">{c.name}</span>
                    {c.company && (
                      <span className="truncate text-xs text-muted-foreground">{c.company}</span>
                    )}
                  </span>
                </button>
              </li>
            ))}

            {customers.length === 0 && debouncedQuery && (
              <li className="px-2 py-4 text-center text-sm text-muted-foreground">
                Sin resultados para "{debouncedQuery}"
              </li>
            )}
          </div>
        </ul>
      )}
    </div>
  )
}
