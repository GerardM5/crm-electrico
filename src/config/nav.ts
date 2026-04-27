import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  FileArchive,
  FileText,
  Gauge,
  Home,
  KanbanSquare,
  ReceiptText,
  Settings,
  SolarPanel,
  Users,
  Zap,
} from 'lucide-react'

export const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/customers', label: 'Clientes', icon: Building2 },
  { href: '/deals', label: 'Oportunidades', icon: BriefcaseBusiness },
  { href: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { href: '/invoices', label: 'Facturas', icon: ReceiptText },
  { href: '/simulations', label: 'Simulador', icon: Gauge },
  { href: '/proposals', label: 'Propuestas', icon: FileText },
  { href: '/contracts', label: 'Contratos', icon: ClipboardCheck },
  { href: '/installations', label: 'Instalaciones', icon: SolarPanel },
  { href: '/tasks', label: 'Tareas', icon: BarChart3 },
  { href: '/documents', label: 'Documentos', icon: FileArchive },
  { href: '/settings', label: 'Configuracion', icon: Settings },
]

export const appBrand = {
  name: 'Energiza CRM',
  description: 'CRM vertical energetico',
  icon: Zap,
}
