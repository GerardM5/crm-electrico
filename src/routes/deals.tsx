import { TrendingUp } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { DataTable, EmptyState, Td, Tr } from '../components/ui/table'
import { DealFormDialog } from '../features/deals/DealFormDialog'
import { formatDate, money } from '../lib/formatters'
import { useCustomers } from '../services/customers.service'
import { useDeals, usePipelineStages } from '../services/deals.service'
import { useProfiles } from '../services/profiles.service'

export function DealsRoute() {
  const { data: deals = [] } = useDeals()
  const { data: customersResult } = useCustomers({ pageSize: 500 })
  const { data: stages = [] } = usePipelineStages()
  const { data: profiles = [] } = useProfiles()

  const customers = customersResult?.data ?? []

  const profilesById = useMemo(
    () => Object.fromEntries(profiles.map((p) => [p.id, p.full_name])),
    [profiles],
  )
  const stagesById = useMemo(
    () => Object.fromEntries(stages.map((s) => [s.id, s.name])),
    [stages],
  )
  const customersById = useMemo(
    () => Object.fromEntries(customers.map((c) => [c.id, c.name])),
    [customers],
  )

  return (
    <div>
      <PageHeader title="Oportunidades" description="Vista tabular del pipeline comercial." action={<DealFormDialog />} />
      {deals.length === 0 ? (
        <EmptyState
          icon={<TrendingUp />}
          title="Sin oportunidades"
          description="Crea tu primera oportunidad para empezar a trackear el pipeline."
          action={<DealFormDialog />}
        />
      ) : (
        <DataTable headers={['Oportunidad', 'Cliente', 'Fase', 'Valor', 'Prob.', 'Cierre', 'Asignado']}>
          {deals.map((deal) => (
            <Tr key={deal.id} hover>
              <Td variant="primary">{deal.title}</Td>
              <Td variant="muted">
                {deal.customer_id ? (
                  <Link className="text-primary hover:underline" to={`/customers/${deal.customer_id}`}>
                    {customersById[deal.customer_id] ?? '-'}
                  </Link>
                ) : '-'}
              </Td>
              <Td><StatusBadge value={stagesById[deal.stage_id ?? ''] ?? deal.status ?? '-'} /></Td>
              <Td>{money.format(deal.value_eur)}</Td>
              <Td variant="muted">{deal.probability}%</Td>
              <Td variant="muted">{formatDate(deal.expected_close_date ?? undefined)}</Td>
              <Td variant="muted">{profilesById[deal.assigned_to ?? ''] ?? '-'}</Td>
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
