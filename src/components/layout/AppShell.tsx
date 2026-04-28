import { LogOut, Menu, Search, Settings, User } from 'lucide-react'
import { Dialog as DialogPrimitive, DropdownMenu } from 'radix-ui'
import { Suspense, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { appBrand, navItems } from '../../config/nav'
import { cn, initials } from '../../lib/utils'
import { useDemoStore } from '../../store/demo-store'
import { ErrorBoundary } from '../feedback/ErrorBoundary'
import { PageSkeleton } from '../feedback/Skeleton'
import { Button } from '../ui/button'
import { CommandPalette } from './CommandPalette'

type NavBadges = Record<string, number>

function SidebarContent({ onNavigate, badges }: { onNavigate?: () => void; badges?: NavBadges }) {
  const BrandIcon = appBrand.icon
  return (
    <div className="flex h-full flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <BrandIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">{appBrand.name}</p>
          <p className="truncate text-xs text-muted-foreground">{appBrand.description}</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        <div className="grid gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const count = badges?.[item.href] ?? 0
            return (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'focus-ring flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {count > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1 text-[10px] font-semibold text-primary">
                    {count}
                  </span>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export function AppShell() {
  const { currentUser, organization, logout, leads, tasks } = useDemoStore()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const location = useLocation()
  const currentNav = navItems.find((item) => location.pathname.startsWith(item.href))

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const navBadges: NavBadges = {
    '/leads': leads.filter((l) => l.status === 'new').length,
    '/tasks': tasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled').length,
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <SidebarContent badges={navBadges} />
      </aside>

      {/* Mobile drawer via Radix Dialog */}
      <DialogPrimitive.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="animate-fade-in fixed inset-0 z-40 bg-black/50 lg:hidden" />
          <DialogPrimitive.Content
            aria-label="Menu de navegacion"
            className="animate-slide-in-left fixed inset-y-0 left-0 z-50 w-64 shadow-xl lg:hidden"
          >
            <SidebarContent onNavigate={() => setDrawerOpen(false)} badges={navBadges} />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Abrir navegacion">
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Cartera centralizada</p>
              <h1 className="text-lg font-semibold text-slate-950">{currentNav?.label ?? 'Dashboard'}</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="hidden min-h-10 w-full max-w-md cursor-text items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400 transition-colors hover:border-slate-300 hover:bg-white md:flex"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">Buscar clientes, DNI, tareas…</span>
            <kbd className="flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-400 shadow-sm">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          </button>
          <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="focus-ring flex items-center gap-2 rounded-full outline-none"
                aria-label="Menu de usuario"
              >
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium text-slate-950">{currentUser.full_name}</p>
                  <p className="text-xs text-slate-500">{organization.name} · {currentUser.role}</p>
                </div>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">
                  {initials(currentUser.full_name)}
                </div>
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="z-50 min-w-48 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
              >
                <div className="border-b border-slate-100 px-3 py-2 mb-1">
                  <p className="text-sm font-medium text-slate-950">{currentUser.full_name}</p>
                  <p className="text-xs text-slate-500">{currentUser.role}</p>
                </div>
                <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 outline-none hover:bg-slate-50 focus:bg-slate-50">
                  <User className="h-4 w-4 text-slate-400" />
                  Perfil
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-slate-100" />
                <DropdownMenu.Item
                  onSelect={logout}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 outline-none hover:bg-red-50 focus:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </header>
        <main className="mx-auto w-full max-w-[1600px] p-4 md:p-6">
          <ErrorBoundary level="page">
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
