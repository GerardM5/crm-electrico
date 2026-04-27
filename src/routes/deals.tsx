import { Link } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { DataTable } from '../components/ui/table'
import { DealFormDialog } from '../features/deals/DealFormDialog'
import { formatDate, money } from '../lib/formatters'
import { useDemoStore } from '../store/demo-store'

export function DealsRoute() {
  const { deals, customers, pipelineStages, profiles } = useDemoStore()
  return (
    <div>
      <PageHeader title="Oportunidades" description="Vista tabular del pipeline comercial." action={<DealFormDialog />} />
      <DataTable headers={['Oportunidad', 'Cliente', 'Fase', 'Valor', 'Prob.', 'Cierre', 'Asignado']}>
        {deals.map((deal) => (
          <tr key={deal.id} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-medium text-slate-950">{deal.title}</td>
            <td className="px-4 py-3 text-slate-600">
              {deal.customer_id ? (
                <Link className="text-emerald-700 hover:underline" to={`/customers/${deal.customer_id}`}>
                  {customers.find((customer) => customer.id === deal.customer_id)?.name}
                </Link>
              ) : (
                '-'
              )}
            </td>
            <td className="px-4 py-3">
              <StatusBadge value={pipelineStages.find((stage) => stage.id === deal.stage_id)?.name ?? deal.status} />
            </td>
            <td className="px-4 py-3 text-slate-700">{money.format(deal.value_eur)}</td>
            <td className="px-4 py-3 text-slate-600">{deal.probability}%</td>
            <td className="px-4 py-3 text-slate-600">{formatDate(deal.expected_close_date)}</td>
            <td className="px-4 py-3 text-slate-600">{profiles.find((profile) => profile.id === deal.assigned_to)?.full_name ?? '-'}</td>
          </tr>
        ))}
      </DataTable>
      <Button asChild className="mt-4" variant="secondary">
        <Link to="/pipeline">Abrir Kanban</Link>
      </Button>
    </div>
  )
}
