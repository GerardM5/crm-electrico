import { Upload } from 'lucide-react'
import { PageHeader } from '../components/data-table/Toolbar'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Field, Input, Select } from '../components/ui/input'
import { DataTable } from '../components/ui/table'
import { buildStoragePath } from '../lib/storage'
import { formatDate } from '../lib/formatters'
import { useDemoStore } from '../store/demo-store'
import { useState } from 'react'
import type { DocumentType } from '../types/domain'

export function DocumentsRoute() {
  const store = useDemoStore()
  const [customerId, setCustomerId] = useState(store.customers[0]?.id)
  const [fileName, setFileName] = useState('documento-demo.pdf')
  const [type, setType] = useState<DocumentType>('other')

  function createDocument() {
    store.createDocument({
      customer_id: customerId,
      type,
      bucket: type === 'technical_photo' ? 'installation-photos' : 'customer-documents',
      file_name: fileName,
      file_path: buildStoragePath(store.organization.id, customerId, crypto.randomUUID(), fileName),
      mime_type: fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
      size_bytes: 512_000,
      uploaded_by: store.currentUser.id,
    })
  }

  return (
    <div>
      <PageHeader title="Documentos" description="Archivo privado tenant-scoped preparado para Supabase Storage." />
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Subir documento</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Cliente">
              <Select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
                {store.customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tipo">
              <Select value={type} onChange={(event) => setType(event.target.value as DocumentType)}>
                <option value="invoice">Factura</option>
                <option value="proposal">Propuesta</option>
                <option value="contract">Contrato</option>
                <option value="dni">DNI</option>
                <option value="cif">CIF</option>
                <option value="technical_photo">Foto tecnica</option>
                <option value="other">Otro</option>
              </Select>
            </Field>
            <Field label="Archivo">
              <Input type="file" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? 'documento-demo.pdf')} />
            </Field>
            <Button onClick={createDocument}>
              <Upload className="h-4 w-4" />
              Registrar documento
            </Button>
          </CardContent>
        </Card>
        <DataTable headers={['Documento', 'Cliente', 'Tipo', 'Bucket', 'Fecha']}>
          {store.documents.map((document) => (
            <tr key={document.id}>
              <td className="px-4 py-3 font-medium text-slate-950">{document.file_name}</td>
              <td className="px-4 py-3 text-slate-600">{store.customers.find((customer) => customer.id === document.customer_id)?.name}</td>
              <td className="px-4 py-3 text-slate-600">{document.type}</td>
              <td className="px-4 py-3 text-slate-600">{document.bucket}</td>
              <td className="px-4 py-3 text-slate-600">{formatDate(document.created_at)}</td>
            </tr>
          ))}
        </DataTable>
      </div>
    </div>
  )
}
