import { ArrowRight, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Dialog } from '../components/ui/dialog'
import { Field, Input, Select } from '../components/ui/input'
import { DataTable, EmptyState, Td, Tr } from '../components/ui/table'
import { leadStatusLabels } from '../config/constants'

import { LeadFormDialog } from '../features/leads/LeadFormDialog'
import { useDebounce } from '../hooks/use-debounce'
import { money } from '../lib/formatters'
import type { LeadRow } from '../services/leads.service'
import { useLeads } from '../services/leads.service'
import { useProfiles } from '../services/profiles.service'

const PAGE_SIZE = 50

export function LeadsRoute() {
  const [pendingConvert, setPendingConvert] = useState<LeadRow | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(0)

  const debouncedSearch = useDebounce(search, 250)

  const { data: result, isLoading } = useLeads({
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page,
    pageSize: PAGE_SIZE,
  })

  const { data: profiles } = useProfiles()

  const profilesById = useMemo(
    () => Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name])),
    [profiles],
  )

  const leads = result?.data ?? []
  const total = result?.count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Captacion comercial con conversion directa a cliente y actividad trazada."
        action={<LeadFormDialog />}
      />
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <Field label="Buscar" className="flex-1 min-w-48">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0) }}
              className="pl-9"
            />
          </div>
        </Field>
        <Field label="Estado" className="w-52">
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}>
            <option value="all">Todos los estados</option>
            {Object.entries(leadStatusLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </Select>
        </Field>
      </div>
      {!isLoading && leads.length === 0 ? (
        <EmptyState
          title={total === 0 && !debouncedSearch && statusFilter === 'all' ? 'Sin leads todavía' : 'Sin resultados'}
          description={total === 0 && !debouncedSearch && statusFilter === 'all' ? 'Captura tu primer lead para empezar el proceso comercial.' : 'Prueba con otros filtros o términos de búsqueda.'}
          action={total === 0 && !debouncedSearch ? <LeadFormDialog /> : undefined}
        />
      ) : (
        <DataTable
          headers={['Lead', 'Origen', 'Estado', 'Factura estimada', 'Asignado', 'Acciones']}
          pagination={{ page, pageSize: PAGE_SIZE, total, totalPages, onPageChange: setPage, onPageSizeChange: () => { } }}
        >
          {leads.map((lead) => (
            <Tr key={lead.id} hover>
              <Td>
                <p className="font-medium text-foreground">{lead.company_name ?? lead.contact_name}</p>
                <p className="text-xs text-muted-foreground">
                  {lead.contact_name} · {lead.phone ?? lead.email}
                </p>
              </Td>
              <Td variant="muted">{lead.source}</Td>
              <Td><StatusBadge value={leadStatusLabels[lead.status as keyof typeof leadStatusLabels] ?? lead.status} /></Td>
              <Td>{lead.estimated_monthly_bill ? money.format(lead.estimated_monthly_bill) : '-'}</Td>
              <Td variant="muted">{profilesById[lead.assigned_to ?? ''] ?? '-'}</Td>
              <Td>
                <div className="flex gap-2">
                  <LeadFormDialog lead={lead as any} />
                  {lead.status !== 'converted' ? (
                    <Button size="sm" onClick={() => setPendingConvert(lead)}>
                      Convertir
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : lead.converted_customer_id ? (
                    <Button asChild size="sm" variant="secondary">
                      <Link to={`/customers/${lead.converted_customer_id}`}>Ver cliente</Link>
                    </Button>
                  ) : null}
                </div>
              </Td>
            </Tr>
          ))}
        </DataTable>
      )}

      <Dialog
        open={!!pendingConvert}
        onOpenChange={(open) => { if (!open) setPendingConvert(null) }}
        title="Convertir lead en cliente"
      >
        <p className="text-sm text-muted-foreground">
          ¿Confirmas convertir <strong className="text-foreground">{pendingConvert?.company_name ?? pendingConvert?.contact_name}</strong> en cliente?
          Esta acción creará un cliente y no se puede deshacer.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setPendingConvert(null)}>Cancelar</Button>
          <Button onClick={() => setPendingConvert(null)}>
            Confirmar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Dialog>
    </div>
  )
}


