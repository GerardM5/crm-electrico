import { Dialog as DialogPrimitive } from 'radix-ui'
import {
  Building2,
  FileArchive,
  Hash,
  Home,
  Search,
  Settings,
  ShieldCheck,
  UserCircle,
  Users,
  CheckSquare,
  ArrowRight,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDemoStore } from '../../store/demo-store'
import { navItems } from '../../config/nav'

type ResultItem = {
  id: string
  category: string
  categoryIcon: React.ElementType
  label: string
  sublabel?: string
  href: string
  icon: React.ElementType
}

function highlight(text: string, query: string) {
  if (!query) return <span>{text}</span>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <span>{text}</span>
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-emerald-100 text-emerald-800 rounded px-0.5 not-italic font-semibold">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </span>
  )
}

const categoryIconMap: Record<string, React.ElementType> = {
  'Páginas': Home,
  'Clientes': Building2,
  'Leads': UserCircle,
  'Tareas': CheckSquare,
  'Documentos': FileArchive,
}

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { customers, leads, tasks, documents } = useDemoStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const results = useMemo<ResultItem[]>(() => {
    const q = query.trim().toLowerCase()

    const pages: ResultItem[] = navItems
      .filter((item) => !q || item.label.toLowerCase().includes(q))
      .map((item) => ({ id: `nav-${item.href}`, category: 'Páginas', categoryIcon: Home, label: item.label, href: item.href, icon: item.icon }))

    if (!q) return pages

    const cust: ResultItem[] = customers
      .filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.dni?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q),
      )
      .slice(0, 6)
      .map((c) => ({ id: `customer-${c.id}`, category: 'Clientes', categoryIcon: Building2, label: c.name, sublabel: c.company ?? c.email ?? c.city, href: `/customers/${c.id}`, icon: Building2 }))

    const ls: ResultItem[] = leads
      .filter((l) => l.contact_name.toLowerCase().includes(q) || l.company_name?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q))
      .slice(0, 4)
      .map((l) => ({ id: `lead-${l.id}`, category: 'Leads', categoryIcon: UserCircle, label: l.company_name ?? l.contact_name, sublabel: l.contact_name, href: '/customers', icon: UserCircle }))

    const ts: ResultItem[] = tasks
      .filter((t) => t.title.toLowerCase().includes(q) && t.status !== 'done')
      .slice(0, 4)
      .map((t) => ({ id: `task-${t.id}`, category: 'Tareas', categoryIcon: CheckSquare, label: t.title, sublabel: t.priority, href: '/customers', icon: CheckSquare }))

    const docs: ResultItem[] = documents
      .filter((d) => d.file_name.toLowerCase().includes(q))
      .slice(0, 4)
      .map((d) => ({ id: `doc-${d.id}`, category: 'Documentos', categoryIcon: FileArchive, label: d.file_name, sublabel: d.type, href: '/documents', icon: FileArchive }))

    return [...pages, ...cust, ...ls, ...ts, ...docs]
  }, [query, customers, leads, tasks, documents])

  const grouped = useMemo(() => {
    const map = new Map<string, ResultItem[]>()
    for (const item of results) {
      const arr = map.get(item.category) ?? []
      arr.push(item)
      map.set(item.category, arr)
    }
    return map
  }, [results])

  const flat = results

  const select = useCallback((item: ResultItem) => {
    navigate(item.href)
    onOpenChange(false)
  }, [navigate, onOpenChange])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, flat.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && flat[activeIndex]) select(flat[activeIndex])
    if (e.key === 'Escape') onOpenChange(false)
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-150" />
        <DialogPrimitive.Content
          aria-label="Búsqueda global"
          onKeyDown={onKeyDown}
          className="fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-24px)] max-w-xl -translate-x-1/2 rounded-xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
        >
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar clientes, leads, tareas, páginas…"
              className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
            />
            <kbd className="hidden rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 sm:block">ESC</kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto overscroll-contain p-2">
            {flat.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-sm text-slate-400">
                <Zap className="h-7 w-7 text-slate-300" />
                Sin resultados para «{query}»
              </div>
            ) : (
              Array.from(grouped.entries()).map(([category, items]) => {
                const CatIcon = categoryIconMap[category] ?? Hash
                return (
                  <div key={category} className="mb-1">
                    <div className="flex items-center gap-1.5 px-2 py-1.5">
                      <CatIcon className="h-3 w-3 text-slate-400" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{category}</span>
                    </div>
                    {items.map((item) => {
                      const globalIdx = flat.indexOf(item)
                      const isActive = globalIdx === activeIndex
                      const Icon = item.icon
                      return (
                        <button
                          key={item.id}
                          type="button"
                          data-index={globalIdx}
                          onMouseEnter={() => setActiveIndex(globalIdx)}
                          onClick={() => select(item)}
                          className={[
                            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                            isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50',
                          ].join(' ')}
                        >
                          <div className={['grid h-8 w-8 shrink-0 place-items-center rounded-md', isActive ? 'bg-emerald-100' : 'bg-slate-100'].join(' ')}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{highlight(item.label, query)}</p>
                            {item.sublabel && <p className="truncate text-xs text-slate-400">{item.sublabel}</p>}
                          </div>
                          {isActive && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-emerald-500" />}
                        </button>
                      )
                    })}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-[10px] text-slate-400">
            <div className="flex items-center gap-3">
              <span><kbd className="font-mono">↑↓</kbd> navegar</span>
              <span><kbd className="font-mono">↵</kbd> abrir</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-emerald-500" />
              <span>Renovaciones CRM</span>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
