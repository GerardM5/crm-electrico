import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Field, Input, Select, Textarea } from '../components/ui/input'
import { DataTable, EmptyState, Td, Tr } from '../components/ui/table'
import { priorityLabels, taskStatusLabels } from '../config/constants'
import { formatDateTime } from '../lib/formatters'
import { type TaskFormValues, taskSchema } from '../schemas/forms.schema'
import { useDemoStore } from '../store/demo-store'

const defaultDueAt = '2026-04-28T09:00'

export function TasksRoute() {
  const store = useDemoStore()
  const visibleTasks = store.currentUser.role === 'owner' || store.currentUser.role === 'admin' ? store.tasks : store.tasks.filter((task) => task.assigned_to === store.currentUser.id)
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema) as never,
    defaultValues: {
      title: '',
      priority: 'medium',
      status: 'pending',
      assigned_to: 'user-sales',
      due_at: defaultDueAt,
    },
  })

  function onSubmit(values: TaskFormValues) {
    store.createTask(values)
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
                {store.customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
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
                {store.profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.full_name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Descripcion" error={form.formState.errors.description?.message}>
              <Textarea {...form.register('description')} />
            </Field>
            <Button type="submit">Crear tarea</Button>
          </form>
        </section>
        {visibleTasks.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 />}
            title="Sin tareas"
            description="Crea una tarea para llevar el seguimiento comercial y operativo."
          />
        ) : (
          <DataTable headers={['Tarea', 'Cliente', 'Prioridad', 'Estado', 'Vence', 'Asignado', 'Acciones']}>
            {visibleTasks.map((task) => (
              <Tr key={task.id} hover>
                <Td variant="primary">{task.title}</Td>
                <Td>
                  {(() => {
                    const customer = store.customers.find((c) => c.id === task.customer_id)
                    return customer ? (
                      <Link
                        to={`/customers/${customer.id}`}
                        className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {customer.name}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )
                  })()}
                </Td>
                <Td><StatusBadge value={priorityLabels[task.priority]} /></Td>
                <Td><StatusBadge value={taskStatusLabels[task.status]} /></Td>
                <Td variant="muted">{formatDateTime(task.due_at)}</Td>
                <Td variant="muted">{store.profiles.find((profile) => profile.id === task.assigned_to)?.full_name}</Td>
                <Td>
                  {task.status !== 'done' ? (
                    <Button size="sm" variant="secondary" onClick={() => store.completeTask(task.id)}>
                      <CheckCircle2 className="h-4 w-4" />
                      Completar
                    </Button>
                  ) : null}
                </Td>
              </Tr>
            ))}
          </DataTable>
        )}
      </div>
    </div>
  )
}
