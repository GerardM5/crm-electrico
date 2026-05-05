import { zodResolver } from '@hookform/resolvers/zod'
import { MapPin } from 'lucide-react'
import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Field, Input, Select, Textarea } from '../components/ui/input'
import { DataTable, EmptyState, Td, Tr } from '../components/ui/table'
import { installationStatusLabels } from '../config/constants'
import { useGeolocation } from '../hooks/use-geolocation'
import { formatDateTime } from '../lib/formatters'
import { type InstallationFormValues, installationSchema } from '../schemas/forms.schema'
import { useCustomers } from '../services/customers.service'
import { useCreateInstallation, useInstallations, useUpdateInstallation } from '../services/installations.service'
import { useProfiles } from '../services/profiles.service'

export function InstallationsRoute() {
  const { data: installations = [] } = useInstallations()
  const { data: customersResult } = useCustomers({ pageSize: 500 })
  const { data: profiles = [] } = useProfiles()
  const createInstallation = useCreateInstallation()
  const updateInstallation = useUpdateInstallation()
  const { isLocating, getCurrentPosition } = useGeolocation()

  const customers = customersResult?.data ?? []
  const customersById = useMemo(
    () => Object.fromEntries(customers.map((c) => [c.id, c.name])),
    [customers],
  )
  const profilesById = useMemo(
    () => Object.fromEntries(profiles.map((p) => [p.id, p.full_name])),
    [profiles],
  )
  const technicians = profiles.filter((p) => ['technician', 'admin', 'owner'].includes(p.role))

  const form = useForm<InstallationFormValues>({
    resolver: zodResolver(installationSchema) as never,
    defaultValues: {
      customer_id: customers[0]?.id ?? '',
      status: 'pending',
      type: 'Autoconsumo solar',
      assigned_technician: technicians[0]?.id ?? '',
    },
  })
  const watchedCustomerId = useWatch({ control: form.control, name: 'customer_id' })

  function selectCustomer(customerId: string) {
    const customer = customers.find((c) => c.id === customerId)
    form.setValue('customer_id', customerId)
    if (customer) {
      form.setValue('address', customer.address ?? '')
      form.setValue('city', customer.city ?? '')
      form.setValue('province', customer.province ?? '')
      form.setValue('postal_code', customer.postal_code ?? '')
    }
  }

  function onSubmit(values: InstallationFormValues) {
    createInstallation.mutate({
      ...values,
      scheduled_at: values.scheduled_at ? new Date(values.scheduled_at).toISOString() : null,
    })
  }

  async function saveLocation(installationId: string) {
    const position = await getCurrentPosition()
    updateInstallation.mutate({
      id: installationId,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      status: 'in_progress',
    })
  }

  return (
    <div>
      <PageHeader title="Instalaciones y visitas" description="Flujo tecnico con asignacion y geolocalizacion." />
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader><CardTitle>Nueva instalacion</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <Field label="Cliente" error={form.formState.errors.customer_id?.message}>
                <Select value={watchedCustomerId} onChange={(e) => selectCustomer(e.target.value)}>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
              <Field label="Tipo" error={form.formState.errors.type?.message}>
                <Input {...form.register('type')} />
              </Field>
              <Field label="Direccion" error={form.formState.errors.address?.message}>
                <Input {...form.register('address')} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Estado" error={form.formState.errors.status?.message}>
                  <Select {...form.register('status')}>
                    <option value="pending">Pendiente</option>
                    <option value="scheduled">Programada</option>
                    <option value="in_progress">En curso</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
                  </Select>
                </Field>
                <Field label="Fecha" error={form.formState.errors.scheduled_at?.message}>
                  <Input type="datetime-local" {...form.register('scheduled_at')} />
                </Field>
              </div>
              <Field label="Tecnico" error={form.formState.errors.assigned_technician?.message}>
                <Select {...form.register('assigned_technician')}>
                  {technicians.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </Select>
              </Field>
              <Field label="Notas" error={form.formState.errors.notes?.message}>
                <Textarea {...form.register('notes')} />
              </Field>
              <Button type="submit" disabled={createInstallation.isPending}>Crear instalacion</Button>
            </form>
          </CardContent>
        </Card>
        {installations.length === 0 ? (
          <EmptyState title="Sin instalaciones" description="Registra la primera instalacion o visita tecnica para un cliente." />
        ) : (
          <DataTable headers={['Instalacion', 'Cliente', 'Tecnico', 'Fecha', 'Estado', 'Ubicacion', 'Acciones']}>
            {installations.map((installation) => (
              <Tr key={installation.id} hover>
                <Td variant="primary">{installation.type}</Td>
                <Td variant="muted">{customersById[installation.customer_id] ?? '-'}</Td>
                <Td variant="muted">{profilesById[installation.assigned_technician ?? ''] ?? '-'}</Td>
                <Td variant="muted">{formatDateTime(installation.scheduled_at ?? undefined)}</Td>
                <Td><StatusBadge value={installationStatusLabels[installation.status as keyof typeof installationStatusLabels] ?? installation.status} /></Td>
                <Td className="text-xs" variant="muted">
                  {installation.latitude && installation.longitude
                    ? `${Number(installation.latitude).toFixed(4)}, ${Number(installation.longitude).toFixed(4)}`
                    : 'Pendiente'}
                </Td>
                <Td>
                  <Button size="sm" variant="secondary" disabled={isLocating} onClick={() => saveLocation(installation.id)}>
                    <MapPin className="h-4 w-4" />
                    GPS
                  </Button>
                </Td>
              </Tr>
            ))}
          </DataTable>
        )}
      </div>
    </div>
  )
}
