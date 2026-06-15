import { ArrowUpRight, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Field, Input, Select } from '../components/ui/input'
import { DataTable, EmptyState, Td, Tr } from '../components/ui/table'
import { incidentStatusLabels, priorityLabels } from '../config/constants'
import { useDebounce } from '../hooks/use-debounce'
import { usePagination } from '../hooks/use-pagination'
import { formatDate } from '../lib/formatters'
import { useCustomers } from '../services/customers.service'
import { type IncidentRow, useIncidents } from '../services/incidents.service'
import { useProfiles } from '../services/profiles.service'

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

export function IncidentsRoute() {
  const { data: incidents = [] } = useIncidents()
  const { data: customersResult } = useCustomers({ pageSize: 500 })
  const { data: profiles = [] } = useProfiles()

  const customers = customersResult?.data ?? []
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)

  const customerById = useMemo(() => Object.fromEntries(customers.map((c) => [c.id, c.name])), [customers])
  const profileById = useMemo(() => Object.fromEntries(profiles.map((p) => [p.id, p.full_name])), [profiles])

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase()
    return incidents
      .filter((i) => (status ? i.status === status : true))
      .filter((i) => (priority ? i.priority === priority : true))
      .filter((i) => (q ? i.title.toLowerCase().includes(q) || (customerById[i.customer_id] ?? '').toLowerCase().includes(q) : true))
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9))
  }, [incidents, status, priority, debouncedSearch, customerById])

  const pagination = usePagination(filtered, 25)

  return (
    <div>
      <PageHeader
        title="Incidencias"
        description="Seguimiento de incidencias técnicas y comerciales de todos los clientes."
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="Buscar" className="min-w-48 flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Título o cliente..." />
          </div>
        </Field>
        <Field label="Estado">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(incidentStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Prioridad">
          <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">Todas</option>
            {Object.entries(priorityLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </Field>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Sin incidencias" description="Las incidencias se registran desde la ficha de cada cliente." />
      ) : (
        <DataTable
          headers={['Título', 'Prioridad', 'Cliente', 'Asignada a', 'Fecha', 'Estado', '']}
          pagination={{ page: pagination.page, pageSize: pagination.pageSize, total: pagination.total, totalPages: pagination.totalPages, onPageChange: pagination.setPage, onPageSizeChange: pagination.setPageSize }}
        >
          {pagination.items.map((incident: IncidentRow) => (
            <Tr key={incident.id} hover>
              <Td variant="primary">{incident.title}</Td>
              <Td variant="muted">{priorityLabels[incident.priority] ?? incident.priority}</Td>
              <Td variant="muted">
                <Link to={`/customers/${incident.customer_id}`} className="hover:text-foreground hover:underline">
                  {customerById[incident.customer_id] ?? '—'}
                </Link>
              </Td>
              <Td variant="muted">{incident.assigned_to ? (profileById[incident.assigned_to] ?? '—') : 'Sin asignar'}</Td>
              <Td variant="muted">{formatDate(incident.created_at)}</Td>
              <Td>
                <StatusBadge value={incidentStatusLabels[incident.status] ?? incident.status} />
              </Td>
              <Td>
                <div className="flex items-center justify-end">
                  <Button asChild size="icon" variant="ghost" aria-label="Ver cliente">
                    <Link to={`/customers/${incident.customer_id}`}>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Td>
            </Tr>
          ))}
        </DataTable>
      )}
    </div>
  )
}
