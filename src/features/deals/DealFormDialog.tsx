import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { Field, Input, Select } from '../../components/ui/input'
import { dealSchema, type DealFormValues } from '../../schemas/forms.schema'
import { useCustomers } from '../../services/customers.service'
import { useCreateDeal, usePipelineStages } from '../../services/deals.service'
import { useLeads } from '../../services/leads.service'
import { useProfiles } from '../../services/profiles.service'

export function DealFormDialog() {
  const [open, setOpen] = useState(false)
  const { data: customersData } = useCustomers({ pageSize: 200 })
  const { data: leadsData } = useLeads({ pageSize: 100 })
  const { data: pipelineStages = [] } = usePipelineStages()
  const { data: profiles = [] } = useProfiles()
  const createDeal = useCreateDeal()
  const customers = customersData?.data ?? []
  const leads = leadsData?.data ?? []

  const { register, handleSubmit, formState: { errors }, reset } = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema) as never,
    defaultValues: { stage_id: pipelineStages[0]?.id, probability: 25, value_eur: 0 },
  })

  function onSubmit(values: DealFormValues) {
    createDeal.mutate(
      { ...values, status: 'open' },
      { onSuccess: () => { reset(); setOpen(false) } },
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Nueva oportunidad"
      trigger={
        <Button>
          <Plus className="h-4 w-4" />
          Nueva oportunidad
        </Button>
      }
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Titulo" error={errors.title?.message}>
          <Input {...register('title')} />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Cliente" error={errors.customer_id?.message}>
            <Select {...register('customer_id')}>
              <option value="">Sin cliente</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Lead" error={errors.lead_id?.message}>
            <Select {...register('lead_id')}>
              <option value="">Sin lead</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.company_name ?? lead.contact_name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fase" error={errors.stage_id?.message}>
            <Select {...register('stage_id')}>
              {pipelineStages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Valor EUR" error={errors.value_eur?.message}>
            <Input type="number" step="0.01" {...register('value_eur')} />
          </Field>
          <Field label="Probabilidad %" error={errors.probability?.message}>
            <Input type="number" {...register('probability')} />
          </Field>
          <Field label="Cierre esperado" error={errors.expected_close_date?.message}>
            <Input type="date" {...register('expected_close_date')} />
          </Field>
          <Field label="Asignado a" error={errors.assigned_to?.message}>
            <Select {...register('assigned_to')}>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Button type="submit">Guardar oportunidad</Button>
      </form>
    </Dialog>
  )
}
