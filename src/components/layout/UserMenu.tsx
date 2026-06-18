import { ChevronDown, Eye, LogOut, Settings, Shield, ShoppingBag, Users, Wrench } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn, initials } from '../../lib/utils'
import type { AppRole } from '../../types/database.types'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

const ROLE_CONFIG: Record<AppRole, {
  label: string
  description: string
  icon: React.ElementType
  className: string
}> = {
  owner: { label: 'Propietario', description: 'Acceso total', icon: Shield, className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
  admin: { label: 'Administrador', description: 'Gestión de equipo', icon: Users, className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  sales: { label: 'Comercial', description: 'Clientes propios', icon: ShoppingBag, className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  technician: { label: 'Técnico', description: 'Instalaciones y tareas', icon: Wrench, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  viewer: { label: 'Observador', description: 'Solo lectura', icon: Eye, className: 'bg-muted text-muted-foreground' },
}

export function UserMenu({
  fullName,
  email,
  role,
  organizationName,
  onLogout,
}: {
  fullName: string
  email: string
  role: string
  organizationName: string
  onLogout: () => void
}) {
  const navigate = useNavigate()
  const roleKey = role as AppRole
  const config = ROLE_CONFIG[roleKey] ?? ROLE_CONFIG.viewer
  const RoleIcon = config.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-11 w-full gap-3 rounded-xl px-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Avatar size="sm">
            <AvatarFallback>{initials(fullName)}</AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 text-left sm:block">
            <p className="truncate text-sm font-semibold leading-none text-sidebar-foreground">{fullName}</p>
            <p className="mt-0.5 truncate text-xs text-sidebar-foreground/55">{organizationName}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-sidebar-foreground/50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="min-w-72 rounded-xl p-2 shadow-xl"
      >
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-3 space-y-2.5">
          <div className="flex items-center gap-3">
            <Avatar size="default">
              <AvatarFallback>{initials(fullName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{fullName}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
          <div className={cn('flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium w-fit', config.className)}>
            <RoleIcon className="size-3 shrink-0" />
            <span>{config.label}</span>
            <span className="opacity-60">·</span>
            <span className="font-normal opacity-75">{config.description}</span>
          </div>
        </div>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuItem
          onSelect={() => navigate('/settings')}
          className="gap-3 rounded-lg px-3 py-2"
        >
          <div className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground">
            <Settings className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground">Ajustes</p>
            <p className="truncate text-xs text-muted-foreground">Empresa, permisos y backups</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuItem
          destructive
          onSelect={(event) => {
            event.preventDefault()
            onLogout()
          }}
          className="gap-3 rounded-lg px-3 py-2"
        >
          <div className="grid h-8 w-8 place-items-center rounded-full bg-destructive/10 text-destructive">
            <LogOut className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-medium">Cerrar sesión</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}