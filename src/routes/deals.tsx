import { TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { DataTable, EmptyState, Td, Tr } from '../components/ui/table'
import { DealFormDialog } from '../features/deals/DealFormDialog'
import { formatDate, money } from '../lib/formatters'
import { useDemoStore } from '../store/demo-store'

export function DealsRoute() {
  const { deals, customers, pipelineStages, profiles, currentUser } = useDemoStore()
  const visibleDeals = currentUser.role === 'owner' || currentUser.role === 'admin' ? deals : deals.filter((deal) => deal.assigned_to === currentUser.id)
  return (
    <div>
      <PageHeader title="Oportunidades" description="Vista tabular del pipeline comercial." action={<DealFormDialog />} />
      {visibleDeals.length === 0 ? (
        <EmptyState
          icon={<TrendingUp />}
          title="Sin oportunidades"
          description="Crea tu primera oportunidad para empezar a trackear el pipeline."
          action={<DealFormDialog />}
        />
      ) : (
        <DataTable headers={['Oportunidad', 'Cliente', 'Fase', 'Valor', 'Prob.', 'Cierre', 'Asignado']}>
          {visibleDeals.map((deal) => (
            <Tr key={deal.id} hover>
              <Td variant="primary">{deal.title}</Td>
              <Td variant="muted">
                {deal.customer_id ? (
                  <Link className="text-primary hover:underline" to={`/customers/${deal.customer_id}`}>
                    {customers.find((customer) => customer.id === deal.customer_id)?.name}
                  </Link>
                ) : (
                  '-'
                )}
              </Td>
              <Td><StatusBadge value={pipelineStages.find((stage) => stage.id === deal.stage_id)?.name ?? deal.status} /></Td>
              <Td>{money.format(deal.value_eur)}</Td>
              <Td variant="muted">{deal.probability}%</Td>
              <Td variant="muted">{formatDate(deal.expected_close_date)}</Td>
              <Td variant="muted">{profiles.find((profile) => profile.id === deal.assigned_to)?.full_name ?? '-'}</Td>
            </Tr>
          ))}
        </DataTable>
      )}
      <Button asChild className="mt-4" variant="secondary">
        <Link to="/pipeline">Abrir Kanban</Link>
      </Button>
    </div>
  )
}
