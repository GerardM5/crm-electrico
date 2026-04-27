import { zodResolver } from '@hookform/resolvers/zod'
import { MapPin, Upload } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Field, Input, Select, Textarea } from '../components/ui/input'
import { DataTable } from '../components/ui/table'
import { Tabs } from '../components/ui/tabs'
import { contractStatusLabels, installationStatusLabels, proposalStatusLabels, taskStatusLabels } from '../config/constants'
import { buildStoragePath } from '../lib/storage'
import { formatDate, money } from '../lib/formatters'
import { energyProfileSchema, type EnergyProfileFormValues } from '../schemas/energy-profile.schema'
import { useDemoStore } from '../store/demo-store'

export function CustomerDetailRoute() {
  const { id } = useParams()
  const store = useDemoStore()
  const customer = store.customers.find((item) => item.id === id)
  const [tab, setTab] = useState('summary')

  if (!customer) {
    return (
      <Card>
        <CardContent>
          <p className="text-slate-600">Cliente no encontrado.</p>
          <Button asChild className="mt-4">
            <Link to="/customers">Volver a clientes</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const energy = store.energyProfiles.find((item) => item.customer_id === customer.id)
  const invoices = store.invoices.filter((item) => item.customer_id === customer.id)
  const simulations = store.simulations.filter((item) => item.customer_id === customer.id)
  const proposals = store.proposals.filter((item) => item.customer_id === customer.id)
  const deals = store.deals.filter((item) => item.customer_id === customer.id)
  const contracts = store.contracts.filter((item) => item.customer_id === customer.id)
  const installations = store.installations.filter((item) => item.customer_id === customer.id)
  const tasks = store.tasks.filter((item) => item.customer_id === customer.id)
  const documents = store.documents.filter((item) => item.customer_id === customer.id)

  return (
    <div>
      <PageHeader
        title={customer.name}
        description={`${customer.address ?? 'Direccion pendiente'} · ${customer.city ?? ''} · ${customer.phone ?? customer.email ?? ''}`}
        action={
          customer.latitude && customer.longitude ? (
            <Button asChild variant="secondary">
              <a href={`https://www.google.com/maps?q=${customer.latitude},${customer.longitude}`} target="_blank" rel="noreferrer">
                <MapPin className="h-4 w-4" />
                Ver ubicacion
              </a>
            </Button>
          ) : null
        }
      />

      <Tabs
        value={tab}
        onValueChange={setTab}
        tabs={[
          {
            value: 'summary',
            label: 'Resumen',
            content: (
              <section className="grid gap-4 lg:grid-cols-3">
                <SummaryCard title="Coste mensual" value={energy ? money.format(energy.monthly_cost_eur) : 'Sin perfil'} />
                <SummaryCard title="Consumo mensual" value={energy ? `${energy.monthly_consumption_kwh.toLocaleString('es-ES')} kWh` : '-'} />
                <SummaryCard title="Pipeline" value={`${deals.length} oportunidades`} />
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle>Actividad y elementos relacionados</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-4">
                    <StatusCount label="Facturas" value={invoices.length} />
                    <StatusCount label="Simulaciones" value={simulations.length} />
                    <StatusCount label="Propuestas" value={proposals.length} />
                    <StatusCount label="Tareas" value={tasks.length} />
                  </CardContent>
                </Card>
              </section>
            ),
          },
          { value: 'energy', label: 'Energia', content: <EnergyProfileForm customerId={customer.id} /> },
          {
            value: 'docs',
            label: 'Documentos',
            content: (
              <DataTable headers={['Documento', 'Bucket', 'Tipo', 'Fecha']}>
                {documents.map((document) => (
                  <tr key={document.id}>
                    <td className="px-4 py-3 font-medium text-slate-950">{document.file_name}</td>
                    <td className="px-4 py-3 text-slate-600">{document.bucket}</td>
                    <td className="px-4 py-3 text-slate-600">{document.type}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(document.created_at)}</td>
                  </tr>
                ))}
              </DataTable>
            ),
          },
          {
            value: 'commercial',
            label: 'Comercial',
            content: (
              <div className="grid gap-4">
                <RelatedList
                  title="Propuestas"
                  rows={proposals.map((item) => [item.title, money.format(item.estimated_price_eur), proposalStatusLabels[item.status]])}
                />
                <RelatedList title="Contratos" rows={contracts.map((item) => [item.contract_number, money.format(item.amount_eur), contractStatusLabels[item.status]])} />
              </div>
            ),
          },
          {
            value: 'operations',
            label: 'Operaciones',
            content: (
              <div className="grid gap-4">
                <RelatedList title="Instalaciones" rows={installations.map((item) => [item.type, formatDate(item.scheduled_at), installationStatusLabels[item.status]])} />
                <RelatedList title="Tareas" rows={tasks.map((item) => [item.title, formatDate(item.due_at), taskStatusLabels[item.status]])} />
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}

function EnergyProfileForm({ customerId }: { customerId: string }) {
  const { energyProfiles, upsertEnergyProfile, organization } = useDemoStore()
  const existing = energyProfiles.find((item) => item.customer_id === customerId)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EnergyProfileFormValues>({
    resolver: zodResolver(energyProfileSchema) as never,
    defaultValues: existing ?? {
      customer_id: customerId,
      tariff_type: '3.0TD',
      contracted_power_kw: 15,
      monthly_consumption_kwh: 4500,
      monthly_cost_eur: 650,
      has_solar: false,
    },
  })

  function onSubmit(values: EnergyProfileFormValues) {
    upsertEnergyProfile({
      ...values,
      annual_consumption_kwh: values.annual_consumption_kwh || values.monthly_consumption_kwh * 12,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ficha energetica</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <input type="hidden" value={customerId} {...register('customer_id')} />
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="CUPS" error={errors.cups?.message}>
              <Input placeholder="ES..." {...register('cups')} />
            </Field>
            <Field label="Tarifa" error={errors.tariff_type?.message}>
              <Select {...register('tariff_type')}>
                <option value="2.0TD">2.0TD</option>
                <option value="3.0TD">3.0TD</option>
                <option value="6.1TD">6.1TD</option>
              </Select>
            </Field>
            <Field label="Potencia contratada kW" error={errors.contracted_power_kw?.message}>
              <Input type="number" step="0.01" {...register('contracted_power_kw')} />
            </Field>
            <Field label="Consumo mensual kWh" error={errors.monthly_consumption_kwh?.message}>
              <Input type="number" step="0.01" {...register('monthly_consumption_kwh')} />
            </Field>
            <Field label="Coste mensual EUR" error={errors.monthly_cost_eur?.message}>
              <Input type="number" step="0.01" {...register('monthly_cost_eur')} />
            </Field>
            <Field label="Cubierta m2" error={errors.roof_area_m2?.message}>
              <Input type="number" step="0.01" {...register('roof_area_m2')} />
            </Field>
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" {...register('has_solar')} />
            Tiene o admite instalacion solar
          </label>
          <Field label="Notas" error={errors.notes?.message}>
            <Textarea {...register('notes')} />
          </Field>
          <p className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">
            Storage path recomendado: {buildStoragePath(organization.id, customerId, 'invoice-id', 'factura.pdf')}
          </p>
          <Button type="submit">
            <Upload className="h-4 w-4" />
            Guardar ficha energetica
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      </CardContent>
    </Card>
  )
}

function StatusCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  )
}

function RelatedList({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        {rows.length ? (
          rows.map((row) => (
            <div key={row.join('-')} className="flex items-center justify-between rounded-md border border-slate-100 p-3 text-sm">
              <span className="font-medium text-slate-950">{row[0]}</span>
              <span className="text-slate-500">{row[1]}</span>
              <StatusBadge value={row[2]} />
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">Sin registros todavia.</p>
        )}
      </CardContent>
    </Card>
  )
}
