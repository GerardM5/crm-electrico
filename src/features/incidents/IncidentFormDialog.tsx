import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { Field, Input, Select, Textarea } from '../../components/ui/input'
import { incidentStatusLabels, priorityLabels } from '../../config/constants'
import { type IncidentFormValues, incidentSchema } from '../../schemas/forms.schema'
import type { ContractRow } from '../../services/contracts.service'
import { type IncidentRow, useCreateIncident, useUpdateIncident } from '../../services/incidents.service'
import { useProfiles } from '../../services/profiles.service'

export function IncidentFormDialog({
  customerId,
  contracts = [],
  incident,
}: {
  customerId: string
  contracts?: ContractRow[]
  incident?: IncidentRow
}) {
  const isEditing = Boolean(incident)
  const [open, setOpen] = useState(false)
  const { data: profiles = [] } = useProfiles()
  const createIncident = useCreateIncident()
  const updateIncident = useUpdateIncident()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentSchema) as never,
    defaultValues: {
      customer_id: customerId,
      contract_id: incident?.contract_id ?? '',
      title: incident?.title ?? '',
      description: incident?.description ?? '',
      status: incident?.status ?? 'open',
      priority: incident?.priority ?? 'medium',
      assigned_to: incident?.assigned_to ?? '',
    },
  })

  function onSubmit(values: IncidentFormValues) {
    const payload = {
      customer_id: customerId,
      contract_id: values.contract_id || null,
      title: values.title,
      description: values.description || null,
      status: values.status,
      priority: values.priority,
      assigned_to: values.assigned_to || null,
      resolved_at:
        values.status === 'resolved' || values.status === 'closed'
          ? (incident?.resolved_at ?? new Date().toISOString())
          : null,
    }
    const done = { onSuccess: () => { reset(); setOpen(false) } }
    if (isEditing && incident) {
      updateIncident.mutate({ id: incident.id, ...payload }, done)
    } else {
      createIncident.mutate(payload, done)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title={isEditing ? 'Editar incidencia' : 'Nueva incidencia'}
      trigger={
        isEditing ? (
          <Button variant="secondary" size="sm"><Pencil className="h-4 w-4" />Editar</Button>
        ) : (
          <Button size="sm"><Plus className="h-4 w-4" />Nueva incidencia</Button>
        )
      }
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Título" error={errors.title?.message}>
          <Input {...register('title')} />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Estado" error={errors.status?.message}>
            <Select {...register('status')}>
              {Object.entries(incidentStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Prioridad" error={errors.priority?.message}>
            <Select {...register('priority')}>
              {Object.entries(priorityLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Contrato relacionado" error={errors.contract_id?.message}>
            <Select {...register('contract_id')}>
              <option value="">Sin contrato</option>
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.contract_number ?? c.provider ?? c.id.slice(0, 8)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Asignada a" error={errors.assigned_to?.message}>
            <Select {...register('assigned_to')}>
              <option value="">Sin asignar</option>
              {profiles
                .filter((p) => ['owner', 'admin', 'sales'].includes(p.role))
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
            </Select>
          </Field>
        </div>
        <Field label="Descripción" error={errors.description?.message}>
          <Textarea {...register('description')} />
        </Field>
        <Button type="submit" disabled={isSubmitting}>
          {isEditing ? 'Guardar cambios' : 'Guardar incidencia'}
        </Button>
      </form>
    </Dialog>
  )
}
