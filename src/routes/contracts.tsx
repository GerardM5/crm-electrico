import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Field, Input, Select } from '../components/ui/input'
import { DataTable } from '../components/ui/table'
import { contractStatusLabels } from '../config/constants'
import { money } from '../lib/formatters'
import { buildStoragePath } from '../lib/storage'
import { contractSchema, type ContractFormValues } from '../schemas/forms.schema'
import { useDemoStore } from '../store/demo-store'

export function ContractsRoute() {
  const store = useDemoStore()
  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema) as never,
    defaultValues: {
      customer_id: store.customers[0]?.id,
      status: 'draft',
      contract_number: `EG-2026-${String(store.contracts.length + 1).padStart(4, '0')}`,
      amount_eur: 0,
    },
  })

  function onSubmit(values: ContractFormValues) {
    store.createContract({
      ...values,
      file_path: values.file_path || buildStoragePath(store.organization.id, values.customer_id, crypto.randomUUID(), 'contrato.pdf'),
    })
  }

  return (
    <div>
      <PageHeader title="Contratos" description="Registro de contratos y estado de firma mockeado para demo." />
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nuevo contrato</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <Field label="Cliente" error={form.formState.errors.customer_id?.message}>
                <Select {...form.register('customer_id')}>
                  {store.customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Numero" error={form.formState.errors.contract_number?.message}>
                <Input {...form.register('contract_number')} />
              </Field>
              <Field label="Estado" error={form.formState.errors.status?.message}>
                <Select {...form.register('status')}>
                  <option value="draft">Borrador</option>
                  <option value="sent">Enviado</option>
                  <option value="signed">Firmado</option>
                  <option value="cancelled">Cancelado</option>
                </Select>
              </Field>
              <Field label="Importe EUR" error={form.formState.errors.amount_eur?.message}>
                <Input type="number" step="0.01" {...form.register('amount_eur')} />
              </Field>
              <Button type="submit">Crear contrato</Button>
            </form>
          </CardContent>
        </Card>
        <DataTable headers={['Contrato', 'Cliente', 'Importe', 'Estado', 'Archivo']}>
          {store.contracts.map((contract) => (
            <tr key={contract.id}>
              <td className="px-4 py-3 font-medium text-slate-950">{contract.contract_number}</td>
              <td className="px-4 py-3 text-slate-600">{store.customers.find((customer) => customer.id === contract.customer_id)?.name}</td>
              <td className="px-4 py-3">{money.format(contract.amount_eur)}</td>
              <td className="px-4 py-3">
                <StatusBadge value={contractStatusLabels[contract.status]} />
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">{contract.file_path}</td>
            </tr>
          ))}
        </DataTable>
      </div>
    </div>
  )
}
