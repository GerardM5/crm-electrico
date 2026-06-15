import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { Field, Input, Select, Textarea } from '../../components/ui/input'
import { priorityLabels, taskStatusLabels } from '../../config/constants'
import { useAuth } from '../../features/auth/AuthContext'
import { type TaskFormValues, taskSchema } from '../../schemas/forms.schema'
import type { CustomerRow } from '../../services/customers.service'
import { useProfiles } from '../../services/profiles.service'
import { type TaskRow, useCreateTask, useUpdateTask } from '../../services/tasks.service'

export function TaskFormDialog({
  customers = [],
  customerId,
  task,
}: {
  customers?: CustomerRow[]
  customerId?: string
  task?: TaskRow
}) {
  const isEditing = Boolean(task)
  const [open, setOpen] = useState(false)
  const { profile: currentUser } = useAuth()
  const { data: profiles = [] } = useProfiles()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const defaultDue = useMemo(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10), [])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema) as never,
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      priority: task?.priority ?? 'medium',
      status: task?.status ?? 'pending',
      due_at: task?.due_at?.slice(0, 10) ?? defaultDue,
      assigned_to: task?.assigned_to ?? currentUser?.id ?? '',
      customer_id: task?.customer_id ?? customerId ?? '',
    },
  })

  function onSubmit(values: TaskFormValues) {
    const payload = {
      title: values.title,
      description: values.description || null,
      priority: values.priority,
      status: values.status,
      due_at: values.due_at,
      assigned_to: values.assigned_to || null,
      customer_id: values.customer_id || null,
    }
    const done = { onSuccess: () => { reset(); setOpen(false) } }
    if (isEditing && task) {
      updateTask.mutate({ id: task.id, ...payload }, done)
    } else {
      createTask.mutate(payload, done)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title={isEditing ? 'Editar tarea' : 'Nueva tarea'}
      trigger={
        isEditing ? (
          <Button variant="secondary" size="sm"><Pencil className="h-4 w-4" />Editar</Button>
        ) : (
          <Button size="sm"><Plus className="h-4 w-4" />Nueva tarea</Button>
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
              {Object.entries(taskStatusLabels).map(([value, label]) => (
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
          <Field label="Vencimiento" error={errors.due_at?.message}>
            <Input type="date" {...register('due_at')} />
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
          <Field label="Cliente" error={errors.customer_id?.message}>
            <Select {...register('customer_id')} disabled={Boolean(customerId)}>
              <option value="">Sin cliente</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Descripción" error={errors.description?.message}>
          <Textarea {...register('description')} />
        </Field>
        <Button type="submit" disabled={isSubmitting}>
          {isEditing ? 'Guardar cambios' : 'Guardar tarea'}
        </Button>
      </form>
    </Dialog>
  )
}
