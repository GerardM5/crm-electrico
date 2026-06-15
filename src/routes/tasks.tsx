import { Check, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Field, Input, Select } from '../components/ui/input'
import { DataTable, EmptyState, Td, Tr } from '../components/ui/table'
import { priorityLabels, taskStatusLabels } from '../config/constants'
import { TaskFormDialog } from '../features/tasks/TaskFormDialog'
import { useDebounce } from '../hooks/use-debounce'
import { usePagination } from '../hooks/use-pagination'
import { formatDate } from '../lib/formatters'
import { useCustomers } from '../services/customers.service'
import { useProfiles } from '../services/profiles.service'
import { type TaskRow, useDeleteTask, useTasks, useUpdateTask } from '../services/tasks.service'

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

export function TasksRoute() {
  const { data: tasks = [] } = useTasks()
  const { data: customersResult } = useCustomers({ pageSize: 500 })
  const { data: profiles = [] } = useProfiles()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const customers = customersResult?.data ?? []
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)

  const customerById = useMemo(() => Object.fromEntries(customers.map((c) => [c.id, c.name])), [customers])
  const profileById = useMemo(() => Object.fromEntries(profiles.map((p) => [p.id, p.full_name])), [profiles])

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase()
    return tasks
      .filter((t) => (status ? t.status === status : true))
      .filter((t) => (priority ? t.priority === priority : true))
      .filter((t) => (q ? t.title.toLowerCase().includes(q) || (customerById[t.customer_id ?? ''] ?? '').toLowerCase().includes(q) : true))
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9))
  }, [tasks, status, priority, debouncedSearch, customerById])

  const pagination = usePagination(filtered, 25)

  function completeTask(task: TaskRow) {
    updateTask.mutate({ id: task.id, status: 'done', completed_at: new Date().toISOString() })
  }

  return (
    <div>
      <PageHeader
        title="Tareas"
        description="Seguimiento de tareas priorizadas por cliente, contrato e incidencia."
        action={<TaskFormDialog customers={customers} />}
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="Buscar" className="min-w-48 flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Título o cliente..." />
          </div>
        </Field>
        <Field label="Estado">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(taskStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Prioridad">
          <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">Todas</option>
            {Object.entries(priorityLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </Field>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Sin tareas" description="Crea una tarea para empezar a organizar el trabajo del equipo." />
      ) : (
        <DataTable
          headers={['Título', 'Prioridad', 'Cliente', 'Asignada a', 'Vencimiento', 'Estado', '']}
          pagination={{ page: pagination.page, pageSize: pagination.pageSize, total: pagination.total, totalPages: pagination.totalPages, onPageChange: pagination.setPage, onPageSizeChange: pagination.setPageSize }}
        >
          {pagination.items.map((task: TaskRow) => (
            <Tr key={task.id} hover>
              <Td variant="primary">{task.title}</Td>
              <Td variant="muted">{priorityLabels[task.priority] ?? task.priority}</Td>
              <Td variant="muted">
                {task.customer_id ? (
                  <Link to={`/customers/${task.customer_id}`} className="hover:text-foreground hover:underline">
                    {customerById[task.customer_id] ?? '—'}
                  </Link>
                ) : '—'}
              </Td>
              <Td variant="muted">{task.assigned_to ? (profileById[task.assigned_to] ?? '—') : 'Sin asignar'}</Td>
              <Td variant="muted">{formatDate(task.due_at)}</Td>
              <Td>
                <StatusBadge value={taskStatusLabels[task.status] ?? task.status} />
              </Td>
              <Td>
                <div className="flex items-center justify-end gap-1">
                  {task.status !== 'done' && (
                    <Button size="icon" variant="ghost" aria-label="Completar tarea" onClick={() => completeTask(task)}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <TaskFormDialog customers={customers} task={task} />
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Eliminar tarea"
                    onClick={() => {
                      if (window.confirm('¿Eliminar esta tarea?')) deleteTask.mutate(task.id)
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
    </div>
  )
}
