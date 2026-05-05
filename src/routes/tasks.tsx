import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Field, Input, Select, Textarea } from '../components/ui/input'
import { DataTable, EmptyState, Td, Tr } from '../components/ui/table'
import { priorityLabels, taskStatusLabels } from '../config/constants'
import { useAuth } from '../features/auth/AuthContext'
import { formatDateTime } from '../lib/formatters'
import { type TaskFormValues, taskSchema } from '../schemas/forms.schema'
import { useCustomers } from '../services/customers.service'
import { useProfiles } from '../services/profiles.service'
import { useCreateTask, useTasks, useUpdateTask } from '../services/tasks.service'

export function TasksRoute() {
  const { profile: currentUser } = useAuth()
  const { data: tasks = [] } = useTasks()
  const { data: customersResult } = useCustomers({ pageSize: 500 })
  const { data: profiles = [] } = useProfiles()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const customers = customersResult?.data ?? []

  const profilesById = useMemo(
    () => Object.fromEntries(profiles.map((p) => [p.id, p.full_name])),
    [profiles],
  )
  const customersById = useMemo(
    () => Object.fromEntries(customers.map((c) => [c.id, c.name])),
    [customers],
  )

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema) as never,
    defaultValues: {
      title: '',
      priority: 'medium',
      status: 'pending',
      assigned_to: currentUser?.id ?? '',
      due_at: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    },
  })

  function onSubmit(values: TaskFormValues) {
    createTask.mutate({ ...values, due_at: new Date(values.due_at).toISOString() })
    form.reset({ ...form.getValues(), title: '', description: '' })
  }

  return (
    <div>
      <PageHeader title="Tareas" description="Seguimiento comercial y operativo con asignacion a ventas o tecnico." />
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Nueva tarea</h3>
          </div>
          <form className="grid gap-4 p-4" onSubmit={form.handleSubmit(onSubmit)}>
            <Field label="Titulo" error={form.formState.errors.title?.message}>
              <Input {...form.register('title')} />
            </Field>
            <Field label="Cliente" error={form.formState.errors.customer_id?.message}>
              <Select {...form.register('customer_id')}>
                <option value="">Sin cliente</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prioridad" error={form.formState.errors.priority?.message}>
                <Select {...form.register('priority')}>
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </Select>
              </Field>
              <Field label="Vence" error={form.formState.errors.due_at?.message}>
                <Input type="datetime-local" {...form.register('due_at')} />
              </Field>
            </div>
            <Field label="Asignado a" error={form.formState.errors.assigned_to?.message}>
              <Select {...form.register('assigned_to')}>
                {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </Select>
            </Field>
            <Field label="Descripcion" error={form.formState.errors.description?.message}>
              <Textarea {...form.register('description')} />
            </Field>
            <Button type="submit" disabled={createTask.isPending}>Crear tarea</Button>
          </form>
        </section>
        {tasks.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 />}
            title="Sin tareas"
            description="Crea una tarea para llevar el seguimiento comercial y operativo."
          />
        ) : (
          <DataTable headers={['Tarea', 'Cliente', 'Prioridad', 'Estado', 'Vence', 'Asignado', 'Acciones']}>
            {tasks.map((task) => (
              <Tr key={task.id} hover>
                <Td variant="primary">{task.title}</Td>
                <Td>
                  {task.customer_id && customersById[task.customer_id] ? (
                    <Link to={`/customers/${task.customer_id}`} className="text-sm text-muted-foreground hover:text-foreground hover:underline" onClick={(e) => e.stopPropagation()}>
                      {customersById[task.customer_id]}
                    </Link>
                  ) : <span className="text-sm text-muted-foreground">-</span>}
                </Td>
                <Td><StatusBadge value={priorityLabels[task.priority as keyof typeof priorityLabels] ?? task.priority} /></Td>
                <Td><StatusBadge value={taskStatusLabels[task.status as keyof typeof taskStatusLabels] ?? task.status} /></Td>
                <Td variant="muted">{formatDateTime(task.due_at)}</Td>
                <Td variant="muted">{profilesById[task.assigned_to ?? ''] ?? '-'}</Td>
                <Td>
                  {task.status !== 'done' && (
                    <Button size="sm" variant="secondary" onClick={() => updateTask.mutate({ id: task.id, status: 'done' })}>
                      <CheckCircle2 className="h-4 w-4" />
                      Completar
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </DataTable>
        )}
      </div>
    </div>
  )
}
