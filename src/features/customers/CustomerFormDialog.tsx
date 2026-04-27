import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { Field, Input, Select, Textarea } from '../../components/ui/input'
import { customerSchema, type CustomerFormValues } from '../../schemas/customer.schema'
import { useDemoStore } from '../../store/demo-store'

export function CustomerFormDialog() {
  const [open, setOpen] = useState(false)
  const { createCustomer } = useDemoStore()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema) as never,
    defaultValues: { type: 'business' },
  })

  function onSubmit(values: CustomerFormValues) {
    createCustomer(values)
    reset()
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Nuevo cliente"
      trigger={
        <Button>
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </Button>
      }
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre cliente" error={errors.name?.message}>
            <Input {...register('name')} />
          </Field>
          <Field label="Tipo" error={errors.type?.message}>
            <Select {...register('type')}>
              <option value="residential">Residencial</option>
              <option value="business">Empresa</option>
              <option value="community">Comunidad</option>
              <option value="industrial">Industrial</option>
            </Select>
          </Field>
          <Field label="Razon social" error={errors.legal_name?.message}>
            <Input {...register('legal_name')} />
          </Field>
          <Field label="CIF/NIF" error={errors.tax_id?.message}>
            <Input {...register('tax_id')} />
          </Field>
          <Field label="Contacto" error={errors.contact_name?.message}>
            <Input {...register('contact_name')} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" {...register('email')} />
          </Field>
          <Field label="Telefono" error={errors.phone?.message}>
            <Input type="tel" {...register('phone')} />
          </Field>
          <Field label="Direccion" error={errors.address?.message}>
            <Input {...register('address')} />
          </Field>
          <Field label="Ciudad" error={errors.city?.message}>
            <Input {...register('city')} />
          </Field>
          <Field label="Provincia" error={errors.province?.message}>
            <Input {...register('province')} />
          </Field>
          <Field label="Codigo postal" error={errors.postal_code?.message}>
            <Input {...register('postal_code')} />
          </Field>
        </div>
        <Field label="Notas" error={errors.notes?.message}>
          <Textarea {...register('notes')} />
        </Field>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar cliente'}
        </Button>
      </form>
    </Dialog>
  )
}
