import { Activity, AlertTriangle, CalendarClock, Euro, TrendingDown, TrendingUp, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { getRenewalStage, getVisibleCustomers } from '../lib/customer-workflow'
import { formatDate, money } from '../lib/formatters'
import { useDemoStore } from '../store/demo-store'

export function DashboardRoute() {
  const store = useDemoStore()
  const visibleCustomers = getVisibleCustomers(store.customers, store.currentUser.id, store.currentUser.role)
  const dueCount = visibleCustomers.filter((customer) => ['due', 'urgent', 'overdue'].includes(getRenewalStage(customer))).length
  const pipelineValue = store.deals.filter((deal) => deal.status === 'open').reduce((sum, deal) => sum + deal.value_eur, 0)

  return (
    <div>
      <PageHeader
        title="Cartera y renovaciones"
        description="Vista central de clientes, contratos y avisos automaticos a los 10 meses."
        action={
          <Button asChild>
            <Link to="/renewals">Ver cola de renovacion</Link>
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi title="Leads activos" value={store.leads.filter((lead) => lead.status !== 'lost').length} icon={<Users />} trend={+12} />
        <Kpi title="Clientes activos" value={store.customers.length} icon={<Activity />} trend={+5} />
        <Kpi title="Renovaciones urgentes" value={dueCount} icon={<CalendarClock />} />
        <Kpi title="Pipeline abierto" value={money.format(pipelineValue)} icon={<Euro />} trend={+8} />

      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Clientes a contactar</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {(() => {
              const stagesWithTotals = store.pipelineStages.map((stage) => {
                const deals = store.deals.filter((deal) => deal.stage_id === stage.id)
                const total = deals.reduce((sum, deal) => sum + deal.value_eur, 0)
                return { stage, deals, total }
              })
              const maxTotal = Math.max(...stagesWithTotals.map((s) => s.total), 1)
              return stagesWithTotals.map(({ stage, deals, total }) => (
                <div key={stage.id} className="grid gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{stage.name}</span>
                    <span className="text-slate-500">
                      {deals.length} · {money.format(total)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-emerald-600 transition-all duration-500"
                      style={{ width: `${Math.round((total / maxTotal) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ultimos eventos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {store.activityLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="flex items-start gap-3 rounded-md border border-slate-100 p-3">
                <div className="mt-0.5 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm text-slate-700">{String(log.metadata.label ?? log.action)}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(log.created_at)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function Kpi({ title, value, icon, trend }: { title: string; value: string | number; icon: React.ReactNode; trend?: number }) {
  const isPositive = (trend ?? 0) >= 0
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
          {trend !== undefined && (
            <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {isPositive ? '+' : ''}{trend}% vs mes anterior
            </p>
          )}
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-md bg-emerald-50 text-emerald-700">
          <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
        </div>
      </CardContent>
    </Card>
  )
}
