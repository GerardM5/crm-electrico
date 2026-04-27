import { Link } from 'react-router-dom'
import { Activity, CalendarClock, Euro, TrendingUp, Users } from 'lucide-react'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { money, relativeTime } from '../lib/formatters'
import { useDemoStore } from '../store/demo-store'

export function DashboardRoute() {
  const store = useDemoStore()
  const openDeals = store.deals.filter((deal) => deal.status === 'open')
  const pendingTasks = store.tasks.filter((task) => task.status !== 'done' && task.status !== 'cancelled')
  const pipelineValue = openDeals.reduce((sum, deal) => sum + deal.value_eur, 0)
  const annualSavings = store.simulations.reduce((sum, simulation) => sum + simulation.annual_saving_eur, 0)

  return (
    <div>
      <PageHeader
        title="Panel comercial y operativo"
        description="KPIs calculados desde los datos reales del demo: leads, clientes, propuestas, instalaciones y tareas."
        action={
          <Button asChild>
            <Link to="/leads">Crear lead</Link>
          </Button>
        }
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi title="Leads activos" value={store.leads.filter((lead) => lead.status !== 'lost').length} icon={<Users />} />
        <Kpi title="Clientes" value={store.customers.length} icon={<Activity />} />
        <Kpi title="Pipeline abierto" value={money.format(pipelineValue)} icon={<Euro />} />
        <Kpi title="Ahorro anual simulado" value={money.format(annualSavings)} icon={<TrendingUp />} />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline por fase</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {store.pipelineStages.map((stage) => {
              const deals = store.deals.filter((deal) => deal.stage_id === stage.id)
              const total = deals.reduce((sum, deal) => sum + deal.value_eur, 0)
              return (
                <div key={stage.id} className="grid gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{stage.name}</span>
                    <span className="text-slate-500">
                      {deals.length} · {money.format(total)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-emerald-600"
                      style={{ width: `${Math.min(100, deals.length * 18 + 8)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tareas proximas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {pendingTasks.slice(0, 6).map((task) => (
              <div key={task.id} className="rounded-md border border-slate-100 p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-slate-950">{task.title}</p>
                  <StatusBadge value={task.priority} />
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <CalendarClock className="h-3 w-3" />
                  {relativeTime(task.due_at)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Actividad reciente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {store.activityLogs.slice(0, 8).map((log) => (
            <div key={log.id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
              <p className="text-sm text-slate-700">{String(log.metadata.label ?? log.action)}</p>
              <span className="text-xs text-slate-500">{relativeTime(log.created_at)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function Kpi({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-md bg-emerald-50 text-emerald-700">
          <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
        </div>
      </CardContent>
    </Card>
  )
}
