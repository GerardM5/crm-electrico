import { zodResolver } from '@hookform/resolvers/zod'
import { addMonths } from 'date-fns'
import { Pencil, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { Field, Input, Select, Textarea } from '../../components/ui/input'
import { type CustomerFormValues, customerSchema } from '../../schemas/customer.schema'
import { useAuth } from '../../features/auth/AuthContext'
import { type CustomerRow, useCreateCustomer, useUpdateCustomer } from '../../services/customers.service'
import { useProfiles } from '../../services/profiles.service'
import type { CustomerStatus } from '../../types/database.types'

type FullFormValues = CustomerFormValues & {
  status: CustomerStatus
  contract_signed_at: string
  renewal_date: string
  assigned_to: string
  products_services: string
}

export function CustomerFormDialog({ customer }: { customer?: CustomerRow }) {
  const isEditing = Boolean(customer)
  const [open, setOpen] = useState(false)
  const { profile: currentUser } = useAuth()
  const { data: profiles = [] } = useProfiles()
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const defaultRenewal = useMemo(() => addMonths(new Date(), 12).toISOString().slice(0, 10), [])

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FullFormValues>({
    resolver: zodResolver(customerSchema) as never,
    defaultValues: customer
      ? {
        name: customer.name,
        type: customer.type,
        legal_name: customer.legal_name ?? '',
        tax_id: customer.dni ?? '',
        contact_name: customer.contact_name ?? '',
        email: customer.email ?? '',
        phone: customer.phone ?? '',
        city: customer.city ?? '',
        notes: customer.notes ?? '',
        status: customer.status,
        contract_signed_at: customer.contract_signed_at?.slice(0, 10) ?? today,
        renewal_date: customer.renewal_date?.slice(0, 10) ?? defaultRenewal,
        assigned_to: customer.assigned_to ?? currentUser?.id ?? '',
        products_services: customer.products_services.join(', '),
      }
      : {
        type: 'residential',
        status: 'active',
        contract_signed_at: today,
        renewal_date: defaultRenewal,
        assigned_to: currentUser?.id ?? '',
        products_services: '',
        email: '',
        phone: '',
      },
  })

  function onSubmit(values: FullFormValues) {
    const products = (values.products_services ?? '').split(',').map((s: string) => s.trim()).filter(Boolean)
    if (isEditing && customer) {
      updateCustomer.mutate({
        id: customer.id,
        type: values.legal_name ? 'business' : 'residential',
        name: values.name,
        company: values.legal_name || null,
        legal_name: values.legal_name || null,
        dni: values.tax_id || null,
        status: values.status,
        contact_name: values.contact_name || values.name,
        email: values.email || null,
        phone: values.phone || null,
        city: values.city || null,
        contract_signed_at: values.contract_signed_at,
        renewal_date: values.renewal_date,
        renewal_alert_months: 10,
        assigned_to: values.assigned_to || null,
        products_services: products,
        notes: values.notes || null,
      }, { onSuccess: () => { reset(); setOpen(false) } })
    } else {
      createCustomer.mutate({
        type: values.legal_name ? 'business' : 'residential',
        name: values.name,
        company: values.legal_name || null,
        legal_name: values.legal_name || null,
        dni: values.tax_id || null,
        status: values.status,
        contact_name: values.contact_name || values.name,
        email: values.email || null,
        phone: values.phone || null,
        city: values.city || null,
        contract_signed_at: values.contract_signed_at,
        renewal_date: values.renewal_date,
        renewal_alert_months: 10,
        assigned_to: values.assigned_to || null,
        products_services: products,
        notes: values.notes || null,
      }, { onSuccess: () => { reset(); setOpen(false) } })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title={isEditing ? 'Editar cliente' : 'Nuevo cliente'}
      trigger={
        isEditing ? (
          <Button variant="secondary" size="sm">
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4" />
            Nuevo cliente
          </Button>
        )
      }
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre" error={errors.name?.message}>
            <Input {...register('name')} />
          </Field>
          <Field label="Empresa" error={errors.legal_name?.message}>
            <Input {...register('legal_name')} />
          </Field>
          <Field label="DNI / NIF" error={errors.tax_id?.message}>
            <Input {...register('tax_id')} />
          </Field>
          <Field label="Estado" error={(errors as Record<string, { message?: string }>).status?.message}>
            <Select {...register('status')}>
              <option value="active">Activo</option>
              <option value="renewal_due">Renovacion pendiente</option>
              <option value="renewed">Renovado</option>
              <option value="inactive">Baja</option>
              <option value="lost">Perdido</option>
            </Select>
          </Field>
          <Field label="Fecha contrato" error={(errors as Record<string, { message?: string }>).contract_signed_at?.message}>
            <Input
              type="date"
              {...register('contract_signed_at', {
                onChange: (e) => {
                  const val = e.target.value
                  if (val) setValue('renewal_date', addMonths(new Date(val), 12).toISOString().slice(0, 10))
                },
              })}
            />
          </Field>
          <Field label="Fecha renovacion" error={(errors as Record<string, { message?: string }>).renewal_date?.message}>
            <Input type="date" {...register('renewal_date')} />
          </Field>
          <Field label="Comercial responsable" error={(errors as Record<string, { message?: string }>).assigned_to?.message}>
            <Select {...register('assigned_to')}>
              {profiles
                .filter((p) => ['owner', 'admin', 'sales'].includes(p.role))
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
            </Select>
          </Field>
          <Field label="Ciudad" error={errors.city?.message}>
            <Input {...register('city')} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" autoComplete="email" {...register('email')} />
          </Field>
          <Field label="Telefono" error={errors.phone?.message}>
            <Input type="tel" inputMode="tel" autoComplete="tel" {...register('phone')} />
          </Field>
        </div>
        <Field label="Productos y servicios" error={(errors as Record<string, { message?: string }>).products_services?.message}>
          <Textarea {...register('products_services')} placeholder="Luz pyme, Gas, Mantenimiento anual" />
        </Field>
        <Field label="Notas" error={errors.notes?.message}>
          <Textarea {...register('notes')} />
        </Field>
        <Button type="submit" disabled={isSubmitting}>{isEditing ? 'Guardar cambios' : 'Guardar cliente'}</Button>
      </form>
    </Dialog>
  )
}
