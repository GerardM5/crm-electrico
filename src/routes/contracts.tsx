import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { PageHeader } from '../components/data-table/Toolbar'
import { PdfViewerDialog } from '../components/documents/PdfViewerDialog'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Field, Input, Select } from '../components/ui/input'
import { DataTable, EmptyState, Td, Tr, TruncatePath } from '../components/ui/table'
import { contractStatusLabels } from '../config/constants'
import { money } from '../lib/formatters'
import { type ContractFormValues, contractSchema } from '../schemas/forms.schema'
import { useContracts, useCreateContract } from '../services/contracts.service'
import { useCustomers } from '../services/customers.service'

export function ContractsRoute() {
  const { data: contracts = [] } = useContracts()
  const { data: customersResult } = useCustomers({ pageSize: 500 })
  const createContract = useCreateContract()

  const customers = customersResult?.data ?? []
  const customersById = useMemo(
    () => Object.fromEntries(customers.map((c) => [c.id, c.name])),
    [customers],
  )

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema) as never,
    defaultValues: {
      customer_id: customers[0]?.id ?? '',
      status: 'draft',
      contract_number: `EG-${new Date().getFullYear()}-${String(contracts.length + 1).padStart(4, '0')}`,
      amount_eur: 0,
    },
  })

  function onSubmit(values: ContractFormValues) {
    createContract.mutate(values)
    form.reset({ ...form.getValues(), amount_eur: 0 })
  }

  return (
    <div>
      <PageHeader title="Contratos" description="Registro y seguimiento de contratos vinculados a clientes." />
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nuevo contrato</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <Field label="Cliente" error={form.formState.errors.customer_id?.message}>
                <Select {...form.register('customer_id')}>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
              <Button type="submit" disabled={createContract.isPending}>Crear contrato</Button>
            </form>
          </CardContent>
        </Card>
        {contracts.length === 0 ? (
          <EmptyState title="Sin contratos" description="Genera un contrato y vinculalo a un cliente para empezar." />
        ) : (
          <DataTable headers={['Contrato', 'Cliente', 'Importe', 'Estado', 'Archivo', 'Vista']}>
            {contracts.map((contract) => (
              <Tr key={contract.id} hover>
                <Td variant="primary">{contract.contract_number}</Td>
                <Td variant="muted">{customersById[contract.customer_id] ?? '-'}</Td>
                <Td>{money.format(contract.amount_eur)}</Td>
                <Td><StatusBadge value={contractStatusLabels[contract.status as keyof typeof contractStatusLabels] ?? contract.status} /></Td>
                <Td className="max-w-48"><TruncatePath path={contract.file_path ?? ''} /></Td>
                <Td>
                  <PdfViewerDialog
                    source={{ bucket: 'contracts', file_path: contract.file_path ?? '', file_name: `${contract.contract_number}.pdf`, mime_type: 'application/pdf' }}
                    title={contract.contract_number}
                    description={`Contrato de ${customersById[contract.customer_id] ?? '-'}`}
                  />
                </Td>
              </Tr>
            ))}
          </DataTable>
        )}
      </div>
    </div>
  )
}
