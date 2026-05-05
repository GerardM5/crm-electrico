import { zodResolver } from '@hookform/resolvers/zod'
import { Printer } from 'lucide-react'
import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Field, Input, Select, Textarea } from '../components/ui/input'
import { DataTable, EmptyState, Td, Tr } from '../components/ui/table'
import { proposalStatusLabels } from '../config/constants'
import { money } from '../lib/formatters'
import { type ProposalFormValues, proposalSchema } from '../schemas/forms.schema'
import { useCustomers } from '../services/customers.service'
import { useCreateProposal, useProposals, useUpdateProposal } from '../services/proposals.service'
import { useSimulations } from '../services/simulations.service'

const defaultValidUntil = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

export function ProposalsRoute() {
  const { data: proposals = [] } = useProposals()
  const { data: customersResult } = useCustomers({ pageSize: 500 })
  const { data: simulations = [] } = useSimulations()
  const createProposal = useCreateProposal()
  const updateProposal = useUpdateProposal()

  const customers = customersResult?.data ?? []
  const customersById = useMemo(
    () => Object.fromEntries(customers.map((c) => [c.id, c.name])),
    [customers],
  )

  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema) as never,
    defaultValues: {
      customer_id: customers[0]?.id ?? '',
      simulation_id: simulations[0]?.id ?? '',
      title: 'Propuesta de ahorro energetico',
      services: 'Optimizacion de potencia\nCambio de tarifa\nSeguimiento trimestral',
      estimated_price_eur: 1200,
      valid_until: defaultValidUntil,
    },
  })

  const watchedSimulationId = useWatch({ control: form.control, name: 'simulation_id' })
  const watchedCustomerId = useWatch({ control: form.control, name: 'customer_id' })
  const watchedTitle = useWatch({ control: form.control, name: 'title' })
  const watchedServices = useWatch({ control: form.control, name: 'services' })
  const watchedPrice = useWatch({ control: form.control, name: 'estimated_price_eur' })
  const selectedSimulation = simulations.find((s) => s.id === watchedSimulationId)
  const selectedCustomer = customers.find((c) => c.id === watchedCustomerId)

  function onSubmit(values: ProposalFormValues) {
    createProposal.mutate({
      ...values,
      status: 'draft',
      services: (values.services as unknown as string).split('\n').map((s: string) => s.trim()).filter(Boolean),
      html_snapshot: document.querySelector('.print-page')?.innerHTML ?? null,
    })
  }

  return (
    <div>
      <PageHeader
        title="Propuestas comerciales"
        description="Generacion HTML imprimible con estados draft/sent/accepted/rejected."
        action={
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Imprimir vista
          </Button>
        }
      />
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card className="no-print">
          <CardHeader><CardTitle>Nueva propuesta</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <Field label="Cliente" error={form.formState.errors.customer_id?.message}>
                <Select {...form.register('customer_id')}>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
              <Field label="Simulacion" error={form.formState.errors.simulation_id?.message}>
                <Select {...form.register('simulation_id')}>
                  <option value="">Sin simulacion</option>
                  {simulations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {customersById[s.customer_id] ?? '-'} · {money.format(s.annual_saving_eur)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Titulo" error={form.formState.errors.title?.message}>
                <Input {...form.register('title')} />
              </Field>
              <Field label="Servicios recomendados" error={form.formState.errors.services?.message}>
                <Textarea {...form.register('services')} />
              </Field>
              <Field label="Precio estimado" error={form.formState.errors.estimated_price_eur?.message}>
                <Input type="number" step="0.01" {...form.register('estimated_price_eur')} />
              </Field>
              <Field label="Valida hasta" error={form.formState.errors.valid_until?.message}>
                <Input type="date" {...form.register('valid_until')} />
              </Field>
              <Button type="submit" disabled={createProposal.isPending}>Crear propuesta</Button>
            </form>
          </CardContent>
        </Card>
        <div className="grid gap-4">
          <Card className="print-page">
            <CardContent className="p-8">
              <div className="flex justify-between gap-6 border-b border-border pb-6">
                <div>
                  <p className="text-sm font-semibold uppercase text-primary">Propuesta comercial</p>
                  <h2 className="mt-2 text-3xl font-semibold text-foreground">{watchedTitle}</h2>
                  <p className="mt-2 text-muted-foreground">Cliente: {selectedCustomer?.name ?? 'Selecciona cliente'}</p>
                </div>
              </div>
              <div className="my-6 grid gap-4 md:grid-cols-3">
                <ProposalMetric label="Coste actual" value={selectedSimulation ? money.format(selectedSimulation.current_monthly_cost_eur) : '-'} />
                <ProposalMetric label="Coste propuesto" value={selectedSimulation ? money.format(selectedSimulation.proposed_monthly_cost_eur) : '-'} />
                <ProposalMetric label="Ahorro anual" value={selectedSimulation ? money.format(selectedSimulation.annual_saving_eur) : '-'} />
              </div>
              <h3 className="font-semibold text-foreground">Servicios recomendados</h3>
              <ul className="mt-3 grid gap-2 text-sm text-foreground">
                {(watchedServices as unknown as string)?.split('\n').filter(Boolean).map((service) => <li key={service}>- {service}</li>)}
              </ul>
              <div className="mt-6 rounded-md bg-primary/10 p-4">
                <p className="text-sm text-primary">Precio estimado</p>
                <p className="text-2xl font-semibold text-foreground">{money.format(Number(watchedPrice || 0))}</p>
              </div>
            </CardContent>
          </Card>
          {proposals.length === 0 ? (
            <EmptyState title="Sin propuestas" description="Crea una propuesta comercial para un cliente y aparecera aqui." />
          ) : (
            <DataTable headers={['Propuesta', 'Cliente', 'Importe', 'Validez', 'Estado', 'Acciones']} className="no-print">
              {proposals.map((proposal) => (
                <Tr key={proposal.id} hover>
                  <Td variant="primary">{proposal.title}</Td>
                  <Td variant="muted">{customersById[proposal.customer_id] ?? '-'}</Td>
                  <Td>{money.format(proposal.estimated_price_eur)}</Td>
                  <Td variant="muted">{proposal.valid_until}</Td>
                  <Td><StatusBadge value={proposalStatusLabels[proposal.status as keyof typeof proposalStatusLabels] ?? proposal.status} /></Td>
                  <Td>
                    <select
                      className="min-h-10 rounded-md border border-border bg-background px-2"
                      value={proposal.status}
                      onChange={(e) => updateProposal.mutate({ id: proposal.id, status: e.target.value as typeof proposal.status })}
                    >
                      <option value="draft">Borrador</option>
                      <option value="sent">Enviada</option>
                      <option value="accepted">Aceptada</option>
                      <option value="rejected">Rechazada</option>
                    </select>
                  </Td>
                </Tr>
              ))}
            </DataTable>
          )}
        </div>
      </div>
    </div>
  )
}

function ProposalMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
    </div>
  )
}
