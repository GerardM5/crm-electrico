import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { PageHeader } from '../components/data-table/Toolbar'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Field, Input, Select, Textarea } from '../components/ui/input'
import { DataTable, EmptyState, Td, Tr } from '../components/ui/table'
import { money } from '../lib/formatters'
import { type SimulationFormValues, simulationSchema } from '../schemas/simulation.schema'
import { useCustomers } from '../services/customers.service'
import { useCreateSimulation, useEnergyProfiles, useSimulations } from '../services/simulations.service'

export function SimulationsRoute() {
  const { data: customersResult } = useCustomers({ pageSize: 500 })
  const { data: simulations = [] } = useSimulations()
  const { data: energyProfiles = [] } = useEnergyProfiles()
  const createSimulation = useCreateSimulation()

  const customers = customersResult?.data ?? []

  const customersById = useMemo(
    () => Object.fromEntries(customers.map((c) => [c.id, c.name])),
    [customers],
  )

  const form = useForm<SimulationFormValues>({
    resolver: zodResolver(simulationSchema) as never,
    defaultValues: { customer_id: customers[0]?.id ?? '', estimated_saving_percent: 18, current_monthly_cost_eur: 500 },
  })
  const currentCost = Number(useWatch({ control: form.control, name: 'current_monthly_cost_eur' }) || 0)
  const percent = Number(useWatch({ control: form.control, name: 'estimated_saving_percent' }) || 0)
  const solarInvestment = Number(useWatch({ control: form.control, name: 'solar_investment_eur' }) || 0)
  const watchedCustomerId = useWatch({ control: form.control, name: 'customer_id' })
  const monthlySaving = currentCost * (percent / 100)
  const annualSaving = monthlySaving * 12
  const roiYears = solarInvestment > 0 && annualSaving > 0 ? solarInvestment / annualSaving : null

  function selectCustomer(customerId: string) {
    const energy = energyProfiles.find((item) => item.customer_id === customerId)
    form.setValue('customer_id', customerId)
    if (energy) {
      form.setValue('energy_profile_id', energy.id)
      form.setValue('current_monthly_cost_eur', energy.monthly_cost_eur)
      form.setValue('contracted_power_kw', energy.contracted_power_kw)
      form.setValue('monthly_consumption_kwh', energy.monthly_consumption_kwh)
      form.setValue('tariff_type', energy.tariff_type)
    }
  }

  function onSubmit(values: SimulationFormValues) {
    const monthly = currentCost * (Number(values.estimated_saving_percent) / 100)
    const annual = monthly * 12
    const roi = values.solar_investment_eur && annual > 0 ? values.solar_investment_eur / annual : null
    createSimulation.mutate({
      customer_id: values.customer_id,
      energy_profile_id: values.energy_profile_id ?? null,
      current_monthly_cost_eur: values.current_monthly_cost_eur,
      contracted_power_kw: values.contracted_power_kw ?? null,
      monthly_consumption_kwh: values.monthly_consumption_kwh ?? null,
      tariff_type: values.tariff_type ?? null,
      estimated_saving_percent: values.estimated_saving_percent,
      proposed_monthly_cost_eur: values.current_monthly_cost_eur - monthly,
      monthly_saving_eur: monthly,
      annual_saving_eur: annual,
      solar_investment_eur: values.solar_investment_eur ?? null,
      roi_years: roi,
      notes: values.notes ?? null,
    }, { onSuccess: () => form.reset({ customer_id: values.customer_id, estimated_saving_percent: 18, current_monthly_cost_eur: 500 }) })
  }

  return (
    <div>
      <PageHeader title="Simulador de ahorro" description="Calculo de ahorro mensual, anual y ROI solar para cada cliente." />
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nueva simulacion</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <Field label="Cliente" error={form.formState.errors.customer_id?.message}>
                <Select value={watchedCustomerId} onChange={(event) => selectCustomer(event.target.value)}>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Coste mensual actual" error={form.formState.errors.current_monthly_cost_eur?.message}>
                <Input type="number" step="0.01" {...form.register('current_monthly_cost_eur')} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Potencia kW" error={form.formState.errors.contracted_power_kw?.message}>
                  <Input type="number" step="0.01" {...form.register('contracted_power_kw')} />
                </Field>
                <Field label="kWh mensual" error={form.formState.errors.monthly_consumption_kwh?.message}>
                  <Input type="number" step="0.01" {...form.register('monthly_consumption_kwh')} />
                </Field>
              </div>
              <Field label="Ahorro estimado %" error={form.formState.errors.estimated_saving_percent?.message}>
                <Input type="number" step="0.1" {...form.register('estimated_saving_percent')} />
              </Field>
              <Field label="Inversion solar EUR" error={form.formState.errors.solar_investment_eur?.message}>
                <Input type="number" step="0.01" {...form.register('solar_investment_eur')} />
              </Field>
              <Field label="Notas" error={form.formState.errors.notes?.message}>
                <Textarea {...form.register('notes')} />
              </Field>
              <div className="grid grid-cols-2 gap-3 rounded-md bg-primary/10 p-3 text-sm">
                <div>
                  <p className="text-primary">Coste propuesto</p>
                  <p className="font-semibold text-foreground">{money.format(currentCost - monthlySaving)}</p>
                </div>
                <div>
                  <p className="text-primary">Ahorro anual</p>
                  <p className="font-semibold text-foreground">{money.format(annualSaving)}</p>
                </div>
                {roiYears !== null && (
                  <div className="col-span-2">
                    <p className="text-primary">ROI solar estimado</p>
                    <p className="font-semibold text-foreground">{roiYears.toFixed(1)} años</p>
                  </div>
                )}
              </div>
              <Button type="submit" disabled={createSimulation.isPending}>
                {createSimulation.isPending ? 'Guardando…' : 'Guardar simulacion'}
              </Button>
            </form>
          </CardContent>
        </Card>
        {simulations.length === 0 ? (
          <EmptyState title="Sin simulaciones" description="Crea la primera simulacion de ahorro para un cliente." />
        ) : (
          <DataTable headers={['Cliente', 'Actual', 'Propuesto', 'Ahorro mensual', 'Ahorro anual', 'ROI']}>
            {simulations.map((simulation) => (
              <Tr key={simulation.id} hover>
                <Td variant="primary">{customersById[simulation.customer_id] ?? '-'}</Td>
                <Td>{money.format(simulation.current_monthly_cost_eur)}</Td>
                <Td>{money.format(simulation.proposed_monthly_cost_eur)}</Td>
                <Td>{money.format(simulation.monthly_saving_eur)}</Td>
                <Td>{money.format(simulation.annual_saving_eur)}</Td>
                <Td variant="muted">{simulation.roi_years ? `${Number(simulation.roi_years).toFixed(1)} años` : '-'}</Td>
              </Tr>
            ))}
          </DataTable>
        )}
      </div>
    </div>
  )
}
