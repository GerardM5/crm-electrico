import { PageHeader } from '../components/data-table/Toolbar'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Field, Input } from '../components/ui/input'
import { DataTable } from '../components/ui/table'
import { useDemoStore } from '../store/demo-store'

export function SettingsRoute() {
  const store = useDemoStore()

  return (
    <div>
      <PageHeader
        title="Configuracion"
        description="Datos de empresa, roles demo, fases de pipeline y restauracion de seed."
        action={
          <Button variant="secondary" onClick={store.resetDemo}>
            Restaurar demo
          </Button>
        }
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Empresa</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Nombre">
              <Input value={store.organization.name} onChange={(event) => store.updateOrganization({ name: event.target.value })} />
            </Field>
            <Field label="Razon social">
              <Input value={store.organization.legal_name ?? ''} onChange={(event) => store.updateOrganization({ legal_name: event.target.value })} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="CIF">
                <Input value={store.organization.tax_id ?? ''} onChange={(event) => store.updateOrganization({ tax_id: event.target.value })} />
              </Field>
              <Field label="Telefono">
                <Input value={store.organization.phone ?? ''} onChange={(event) => store.updateOrganization({ phone: event.target.value })} />
              </Field>
            </div>
            <Field label="Direccion">
              <Input value={store.organization.address ?? ''} onChange={(event) => store.updateOrganization({ address: event.target.value })} />
            </Field>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Usuarios demo</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable headers={['Usuario', 'Email', 'Rol']}>
              {store.profiles.map((profile) => (
                <tr key={profile.id}>
                  <td className="px-4 py-3 font-medium text-slate-950">{profile.full_name}</td>
                  <td className="px-4 py-3 text-slate-600">{profile.email}</td>
                  <td className="px-4 py-3 text-slate-600">{profile.role}</td>
                </tr>
              ))}
            </DataTable>
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Fases de pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable headers={['Orden', 'Fase', 'Color', 'Final']}>
              {store.pipelineStages.map((stage) => (
                <tr key={stage.id}>
                  <td className="px-4 py-3 text-slate-600">{stage.position}</td>
                  <td className="px-4 py-3 font-medium text-slate-950">{stage.name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 text-slate-600">
                      <span className="h-3 w-3 rounded-full" style={{ background: stage.color }} />
                      {stage.color}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{stage.is_won ? 'Ganado' : stage.is_lost ? 'Perdido' : '-'}</td>
                </tr>
              ))}
            </DataTable>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
