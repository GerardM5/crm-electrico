import { zodResolver } from '@hookform/resolvers/zod'
import { Upload } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { PageHeader } from '../components/data-table/Toolbar'
import { PdfViewerDialog } from '../components/documents/PdfViewerDialog'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Field, Input, Select } from '../components/ui/input'
import { DataTable, EmptyState, Td, Tr } from '../components/ui/table'
import { useAuth } from '../features/auth/AuthContext'
import { formatDate, money } from '../lib/formatters'
import { type InvoiceFormValues, invoiceSchema } from '../schemas/forms.schema'
import { useCustomers } from '../services/customers.service'
import { useCreateInvoice, useInvoices } from '../services/invoices.service'

export function InvoicesRoute() {
  const { profile: currentUser } = useAuth()
  const { data: customersResult } = useCustomers({ pageSize: 500 })
  const { data: invoices = [] } = useInvoices()
  const createInvoice = useCreateInvoice()

  const customers = customersResult?.data ?? []
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const customersById = useMemo(
    () => Object.fromEntries(customers.map((c) => [c.id, c.name])),
    [customers],
  )

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema) as never,
    defaultValues: { customer_id: customers[0]?.id ?? '', file_name: '', total_amount_eur: 0 },
  })

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
    if (file) form.setValue('file_name', file.name)
  }

  function onSubmit(values: InvoiceFormValues) {
    if (!selectedFile || !currentUser) return
    createInvoice.mutate(
      {
        file: selectedFile,
        dto: {
          customer_id: values.customer_id,
          total_amount_eur: values.total_amount_eur,
          consumption_kwh: values.consumption_kwh ?? null,
          contracted_power_kw: values.contracted_power_kw ?? null,
          tariff_type: values.tariff_type ?? null,
          provider: values.provider ?? null,
          uploaded_by: currentUser.id,
        },
      },
      {
        onSuccess: () => {
          form.reset({ customer_id: values.customer_id, file_name: '', total_amount_eur: 0 })
          setSelectedFile(null)
          if (fileInputRef.current) fileInputRef.current.value = ''
        },
      },
    )
  }

  return (
    <div>
      <PageHeader title="Facturas PDF" description="Sube facturas PDF a Supabase Storage y registra los datos de consumo." />
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Subir factura</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <Field label="Cliente" error={form.formState.errors.customer_id?.message}>
                <Select {...form.register('customer_id')}>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Archivo PDF" error={form.formState.errors.file_name?.message}>
                <Input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileChange} />
              </Field>
              <Field label="Importe total EUR" error={form.formState.errors.total_amount_eur?.message}>
                <Input type="number" step="0.01" {...form.register('total_amount_eur')} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Consumo kWh" error={form.formState.errors.consumption_kwh?.message}>
                  <Input type="number" step="0.01" {...form.register('consumption_kwh')} />
                </Field>
                <Field label="Potencia kW" error={form.formState.errors.contracted_power_kw?.message}>
                  <Input type="number" step="0.01" {...form.register('contracted_power_kw')} />
                </Field>
              </div>
              <Field label="Tarifa" error={form.formState.errors.tariff_type?.message}>
                <Select {...form.register('tariff_type')}>
                  <option value="2.0TD">2.0TD</option>
                  <option value="3.0TD">3.0TD</option>
                  <option value="6.1TD">6.1TD</option>
                </Select>
              </Field>
              <Field label="Comercializadora" error={form.formState.errors.provider?.message}>
                <Input {...form.register('provider')} />
              </Field>
              <Button type="submit" disabled={!selectedFile || createInvoice.isPending}>
                <Upload className="h-4 w-4" />
                {createInvoice.isPending ? 'Subiendo…' : 'Subir factura'}
              </Button>
            </form>
          </CardContent>
        </Card>
        {invoices.length === 0 ? (
          <EmptyState title="Sin facturas" description="Sube la primera factura PDF de un cliente." />
        ) : (
          <DataTable headers={['Factura', 'Cliente', 'Periodo', 'Importe', 'kWh', 'Proveedor', 'Vista']}>
            {invoices.map((invoice) => (
              <Tr key={invoice.id} hover>
                <Td variant="primary">{invoice.file_name}</Td>
                <Td variant="muted">{customersById[invoice.customer_id] ?? '-'}</Td>
                <Td variant="muted">{formatDate(invoice.period_start ?? undefined)}</Td>
                <Td>{money.format(invoice.total_amount_eur)}</Td>
                <Td variant="muted">{invoice.consumption_kwh?.toLocaleString('es-ES') ?? '-'}</Td>
                <Td variant="muted">{invoice.provider ?? '-'}</Td>
                <Td>
                  <PdfViewerDialog
                    source={{ bucket: 'documents', file_path: invoice.file_path, file_name: invoice.file_name, mime_type: 'application/pdf' }}
                    title={invoice.file_name}
                    description={`Factura de ${customersById[invoice.customer_id] ?? '-'}`}
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
