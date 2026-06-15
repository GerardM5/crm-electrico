import { Clock, FileText, Phone, RefreshCw, Trash2, Upload, UserCheck } from 'lucide-react'
import { type ReactNode, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { DocumentUploadDialog } from '../components/documents/DocumentUploadDialog'
import { PdfViewerDialog } from '../components/documents/PdfViewerDialog'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { DataTable, EmptyState, Td, Tr, TruncatePath } from '../components/ui/table'
import { contractStatusLabels, customerStatusLabels, incidentStatusLabels, priorityLabels } from '../config/constants'
import { ContractFormDialog } from '../features/contracts/ContractFormDialog'
import { CustomerFormDialog } from '../features/customers/CustomerFormDialog'
import { IncidentFormDialog } from '../features/incidents/IncidentFormDialog'
import { useCustomerActions } from '../hooks/use-customer-actions'
import { getDaysToRenewal, getRenewalAlertDate } from '../lib/customer-workflow'
import { formatDate, relativeTime } from '../lib/formatters'
import { isPdfDocument } from '../lib/storage'
import { useActivityLogs } from '../services/activity.service'
import { useContracts, useDeleteContract } from '../services/contracts.service'
import { useCustomer } from '../services/customers.service'
import { useDocuments } from '../services/documents.service'
import { useIncidents } from '../services/incidents.service'
import { useProfiles } from '../services/profiles.service'

export function CustomerDetailRoute() {
  const { id } = useParams()

  const { data: customer, isLoading } = useCustomer(id)
  const { data: documents = [] } = useDocuments(id)
  const { data: contracts = [] } = useContracts(id)
  const { data: incidents = [] } = useIncidents({ customerId: id })
  const { data: profiles = [] } = useProfiles()
  const { renewCustomer, isPending } = useCustomerActions()
  const deleteContract = useDeleteContract()

  const owner = useMemo(
    () => profiles.find((p) => p.id === customer?.assigned_to),
    [profiles, customer?.assigned_to],
  )
  const profilesById = useMemo(
    () => Object.fromEntries(profiles.map((p) => [p.id, p.full_name])),
    [profiles],
  )
  const activeContracts = contracts.filter((c) => c.status === 'active').length
  const openIncidents = incidents.filter((i) => i.status === 'open' || i.status === 'in_progress').length
  const daysToRenewal = customer ? getDaysToRenewal(customer) : undefined
  const alertDate = customer ? getRenewalAlertDate(customer) : undefined

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando...</p>
  }

  if (!customer) {
    return (
      <div className="flex flex-col gap-4 pt-2">
        <p className="text-sm text-muted-foreground">Cliente no encontrado o sin permisos para verlo.</p>
        <Button asChild size="sm" variant="outline" className="w-fit">
          <Link to="/customers">Volver a clientes</Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={customer.name}
        description={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{customer.company ?? 'Particular'}</span>
            <span className="text-muted-foreground/40">·</span>
            <span>{owner?.full_name ?? 'Sin comercial'}</span>
            {customer.phone && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <a href={`tel:${customer.phone}`} className="hover:text-foreground hover:underline transition-colors">{customer.phone}</a>
              </>
            )}
            {customer.email && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <a href={`mailto:${customer.email}`} className="hover:text-foreground hover:underline transition-colors">{customer.email}</a>
              </>
            )}
          </span>
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            {customer.status !== 'renewed' && (
              <Button size="sm" variant="outline" disabled={isPending} onClick={() => renewCustomer(customer)}>
                <RefreshCw className="h-4 w-4" />Renovar
              </Button>
            )}
            <DocumentUploadDialog
              customerId={customer.id}
              customerName={customer.name}
              trigger={
                <Button size="sm" variant="outline">
                  <Upload className="h-4 w-4" />Subir documento
                </Button>
              }
            />
            <CustomerFormDialog customer={customer} />
          </div>
        }
      />

      {/* KPI strip — flat, no individual card boxes */}
      <div className="mb-8 flex flex-wrap gap-x-8 gap-y-4 border-b border-border pb-6">
        <Stat label="Estado">
          <StatusBadge value={customerStatusLabels[customer.status as keyof typeof customerStatusLabels] ?? customer.status} />
        </Stat>
        <Stat label="Contrato firmado">{formatDate(customer.contract_signed_at ?? undefined)}</Stat>
        <Stat label="Renovación">{formatDate(customer.renewal_date ?? undefined)}</Stat>
        <Stat label="Aviso automático">{alertDate ? formatDate(alertDate.toISOString()) : '—'}</Stat>
        {typeof daysToRenewal === 'number' && (
          <Stat label="Días para renovar">{daysToRenewal} días</Stat>
        )}
        <Stat label="Contratos activos">{activeContracts} / {contracts.length}</Stat>
        <Stat label="Incidencias abiertas">{openIncidents}</Stat>
      </div>

      {/* Detail sections — two columns, divide-y rows, no card wrappers */}
      <section className="grid gap-8 xl:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Ficha del cliente</h3>
          <dl className="overflow-hidden rounded-lg border border-border bg-card divide-y divide-border">
            <DetailRow label="DNI" value={customer.dni ?? '—'} />
            <DetailRow label="Empresa" value={customer.company ?? '—'} />
            <DetailRow label="Productos y servicios" value={customer.products_services.join(', ') || '—'} />
            <DetailRow label="Comercial" value={owner?.full_name ?? '—'} />
            <DetailRow label="Notas" value={customer.notes ?? '—'} />
          </dl>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Resumen comercial</h3>
          <dl className="overflow-hidden rounded-lg border border-border bg-card divide-y divide-border">
            <DetailRow label="Contratos" value={String(contracts.length)} />
            <DetailRow label="Contratos activos" value={String(activeContracts)} />
            <DetailRow label="Incidencias abiertas" value={String(openIncidents)} />
            <DetailRow label="Documentos" value={String(documents.length)} />
          </dl>
        </div>
      </section>

      {/* Contracts — section heading + table */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Contratos energéticos</h3>
          <ContractFormDialog customerId={customer.id} />
        </div>
        {contracts.length === 0 ? (
          <EmptyState
            title="Sin contratos"
            description="Este cliente aún no tiene contratos energéticos registrados."
          />
        ) : (
          <DataTable headers={['Nº / CUPS', 'Comercializadora', 'Producto', 'Tarifa', 'Importe', 'Comisión', 'Vigencia', 'Estado', '']}>
            {contracts.map((contract) => (
              <Tr key={contract.id} hover>
                <Td variant="primary">{contract.contract_number ?? contract.cups ?? '—'}</Td>
                <Td variant="muted">{contract.provider ?? '—'}</Td>
                <Td variant="muted">{contract.product ?? '—'}</Td>
                <Td variant="muted">{contract.tariff_type ?? '—'}</Td>
                <Td variant="muted">{contract.amount_eur.toLocaleString('es-ES')} EUR</Td>
                <Td variant="muted">{contract.commission_eur.toLocaleString('es-ES')} EUR</Td>
                <Td variant="muted">{formatDate(contract.starts_at ?? undefined)} – {formatDate(contract.ends_at ?? undefined)}</Td>
                <Td>
                  <StatusBadge value={contractStatusLabels[contract.status as keyof typeof contractStatusLabels] ?? contract.status} />
                </Td>
                <Td>
                  <div className="flex items-center justify-end gap-1">
                    <ContractFormDialog customerId={customer.id} contract={contract} />
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Eliminar contrato"
                      onClick={() => {
                        if (window.confirm('¿Eliminar este contrato?')) deleteContract.mutate(contract.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </DataTable>
        )}
      </section>

      {/* Incidents — section heading + table */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Incidencias</h3>
          <IncidentFormDialog customerId={customer.id} contracts={contracts} />
        </div>
        {incidents.length === 0 ? (
          <EmptyState
            title="Sin incidencias"
            description="No hay incidencias registradas para este cliente."
          />
        ) : (
          <DataTable headers={['Título', 'Prioridad', 'Asignada a', 'Fecha', 'Estado', '']}>
            {incidents.map((incident) => (
              <Tr key={incident.id} hover>
                <Td variant="primary">{incident.title}</Td>
                <Td variant="muted">{priorityLabels[incident.priority as keyof typeof priorityLabels] ?? incident.priority}</Td>
                <Td variant="muted">{incident.assigned_to ? (profilesById[incident.assigned_to] ?? '—') : 'Sin asignar'}</Td>
                <Td variant="muted">{formatDate(incident.created_at)}</Td>
                <Td>
                  <StatusBadge value={incidentStatusLabels[incident.status as keyof typeof incidentStatusLabels] ?? incident.status} />
                </Td>
                <Td>
                  <div className="flex items-center justify-end">
                    <IncidentFormDialog customerId={customer.id} contracts={contracts} incident={incident} />
                  </div>
                </Td>
              </Tr>
            ))}
          </DataTable>
        )}
      </section>

      {/* Documents — section heading + table, no card wrapper */}
      <section className="mt-8">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Documentos del cliente</h3>
        <DataTable headers={['Archivo', 'Tipo', 'Fecha', 'Ruta', 'Vista']}>
          {documents.map((document) => (
            <Tr key={document.id} hover>
              <Td variant="primary">{document.file_name}</Td>
              <Td variant="muted">{document.type}</Td>
              <Td variant="muted">{formatDate(document.created_at)}</Td>
              <Td className="max-w-48"><TruncatePath path={document.file_path} /></Td>
              <Td>
                {isPdfDocument(document.file_name, document.mime_type ?? undefined) ? (
                  <PdfViewerDialog source={{ bucket: document.bucket, file_path: document.file_path, file_name: document.file_name, mime_type: document.mime_type ?? undefined }} title={document.file_name} description={`Archivo asociado a ${customer.name}`} />
                ) : (
                  <span className="text-xs text-muted-foreground">No PDF</span>
                )}
              </Td>
            </Tr>
          ))}
        </DataTable>
      </section>

      {/* Activity Log */}
      <ActivityLog customerId={customer.id} />
    </div>
  )
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-24">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-semibold text-foreground">{children}</div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-2.5">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm text-foreground">{value}</dd>
    </div>
  )
}

const actionIcons: Record<string, ReactNode> = {
  customer_contacted: <Phone className="h-3.5 w-3.5" />,
  customer_renewed: <RefreshCw className="h-3.5 w-3.5" />,
  customer_created: <UserCheck className="h-3.5 w-3.5" />,
  customer_updated: <FileText className="h-3.5 w-3.5" />,
  contacted: <Phone className="h-3.5 w-3.5" />,
  renewed: <RefreshCw className="h-3.5 w-3.5" />,
  created: <UserCheck className="h-3.5 w-3.5" />,
  updated: <FileText className="h-3.5 w-3.5" />,
}

function ActivityLog({ customerId }: { customerId: string }) {
  const { data: logs = [] } = useActivityLogs(customerId)

  return (
    <section className="mt-8">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Actividad</h3>
      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin actividad registrada.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card divide-y divide-border">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 px-4 py-3">
              <div className="mt-0.5 shrink-0 text-muted-foreground">
                {actionIcons[log.action] ?? <Clock className="h-3.5 w-3.5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{String((log.metadata as { label?: string } | null)?.label ?? log.action)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{relativeTime(log.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
