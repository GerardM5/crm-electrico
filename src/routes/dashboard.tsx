import { Activity, CalendarClock, CheckCircle2, Clock, Euro, FileText, TrendingDown, TrendingUp, Users, Wrench } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { getDaysToRenewal, getRenewalStage, getVisibleCustomers } from '../lib/customer-workflow'
import { money, relativeTime } from '../lib/formatters'
import { useDemoStore } from '../store/demo-store'

const entityIcons: Record<string, ReactNode> = {
  customer: <Users className="h-3.5 w-3.5" />,
  deal: <TrendingUp className="h-3.5 w-3.5" />,
  contract: <FileText className="h-3.5 w-3.5" />,
  task: <CheckCircle2 className="h-3.5 w-3.5" />,
  installation: <Wrench className="h-3.5 w-3.5" />,
  proposal: <FileText className="h-3.5 w-3.5" />,
}

const renewalStageStyle: Record<string, { label: string; className: string }> = {
  overdue: { label: 'Vencido', className: 'text-destructive' },
  urgent: { label: 'Urgente', className: 'text-amber-500' },
  due: { label: 'Contactar', className: 'text-primary' },
  scheduled: { label: 'Programado', className: 'text-muted-foreground' },
}

export function DashboardRoute() {
  const store = useDemoStore()
  const visibleCustomers = getVisibleCustomers(store.customers, store.currentUser.id, store.currentUser.role)
  const dueCount = visibleCustomers.filter((c) => ['due', 'urgent', 'overdue'].includes(getRenewalStage(c))).length
  const pipelineValue = store.deals.filter((d) => d.status === 'open').reduce((sum, d) => sum + d.value_eur, 0)
  const openTasks = store.tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress')
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }

  const urgentRenewals = visibleCustomers
    .map((c) => ({ customer: c, stage: getRenewalStage(c), days: getDaysToRenewal(c) }))
    .filter(({ stage }) => ['overdue', 'urgent', 'due'].includes(stage))
    .sort((a, b) => (a.days ?? 999) - (b.days ?? 999))
    .slice(0, 6)

  const topTasks = [...openTasks]
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 5)

  const stagesWithTotals = store.pipelineStages.map((stage) => {
    const stageDeals = store.deals.filter((d) => d.stage_id === stage.id)
    const total = stageDeals.reduce((sum, d) => sum + d.value_eur, 0)
    return { stage, deals: stageDeals, total }
  })
  const maxTotal = Math.max(...stagesWithTotals.map((s) => s.total), 1)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cartera y renovaciones"
        description="Vista central de clientes, contratos y avisos automaticos a los 10 meses."
        action={
          <Button asChild>
            <Link to="/renewals">Ver cola de renovacion</Link>
          </Button>
        }
      />

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-px bg-border xl:grid-cols-4">
        <Kpi title="Leads activos" value={store.leads.filter((l) => l.status !== 'lost').length} icon={<Users />} trend={+12} />
        <Kpi title="Clientes activos" value={store.customers.length} icon={<Activity />} trend={+5} />
        <Kpi title="Renovaciones urgentes" value={dueCount} icon={<CalendarClock />} />
        <Kpi title="Pipeline abierto" value={money.format(pipelineValue)} icon={<Euro />} trend={+8} />
      </section>

      {/* Main content */}
      <section className="grid gap-8 xl:grid-cols-[1.2fr_1fr]">
        {/* Left column: pipeline + renewals */}
        <div className="space-y-8">
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pipeline comercial</h2>
            <div className="space-y-4">
              {stagesWithTotals.map(({ stage, deals, total }) => (
                <div key={stage.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{stage.name}</span>
                    <span className="tabular-nums text-muted-foreground">{deals.length} · {money.format(total)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted">
                    <div className="h-1.5 rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.round((total / maxTotal) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {urgentRenewals.length > 0 && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Renovaciones urgentes</h2>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/renewals">Ver todas</Link>
                </Button>
              </div>
              <div className="divide-y divide-border">
                {urgentRenewals.map(({ customer, stage, days }) => {
                  const style = renewalStageStyle[stage] ?? renewalStageStyle.due
                  return (
                    <div key={customer.id} className="flex items-center gap-3 py-3 first:pt-0">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.products_services.join(', ') || 'Sin servicios'}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-semibold ${style.className}`}>{style.label}</p>
                        <p className="text-xs text-muted-foreground">{typeof days === 'number' ? (days < 0 ? `${Math.abs(days)}d vencido` : `${days}d`) : '-'}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right column: tasks + activity */}
        <div className="space-y-8">
          {topTasks.length > 0 && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tareas abiertas</h2>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/tasks">Ver todas</Link>
                </Button>
              </div>
              <div className="divide-y divide-border">
                {topTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 py-3 first:pt-0">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {store.profiles.find((p) => p.id === task.assigned_to)?.full_name ?? '-'}
                      </p>
                    </div>
                    <StatusBadge value={task.priority === 'urgent' ? 'Urgente' : task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Actividad reciente</h2>
            <div className="divide-y divide-border">
              {store.activityLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="flex items-start gap-3 py-3 first:pt-0">
                  <div className="mt-0.5 shrink-0 text-muted-foreground">
                    {entityIcons[log.entity_type] ?? <Clock className="h-3.5 w-3.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{String(log.metadata.label ?? log.action)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{relativeTime(log.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function Kpi({ title, value, icon, trend }: { title: string; value: string | number; icon: React.ReactNode; trend?: number }) {
  const isPositive = (trend ?? 0) >= 0
  return (
    <div className="flex items-center justify-between bg-background px-5 py-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
        {trend !== undefined && (
          <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-primary' : 'text-destructive'}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isPositive ? '+' : ''}{trend}% mes anterior
          </p>
        )}
      </div>
      <div className="text-muted-foreground/40">
        <span className="[&>svg]:h-8 [&>svg]:w-8">{icon}</span>
      </div>
    </div>
  )
}
