import { Link } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { DataTable } from '../components/ui/table'
import { customerTypeLabels } from '../config/constants'
import { CustomerFormDialog } from '../features/customers/CustomerFormDialog'
import { money } from '../lib/formatters'
import { useDemoStore } from '../store/demo-store'

export function CustomersRoute() {
  const { customers, energyProfiles } = useDemoStore()

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Base de clientes con acceso a ficha 360: energia, facturas, propuestas, contratos y tareas."
        action={<CustomerFormDialog />}
      />
      <DataTable headers={['Cliente', 'Tipo', 'Ciudad', 'Coste mensual', 'Tarifa', 'Acciones']}>
        {customers.map((customer) => {
          const energy = energyProfiles.find((profile) => profile.customer_id === customer.id)
          return (
            <tr key={customer.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <p className="font-medium text-slate-950">{customer.name}</p>
                <p className="text-xs text-slate-500">
                  {customer.contact_name} · {customer.phone ?? customer.email}
                </p>
              </td>
              <td className="px-4 py-3">
                <StatusBadge value={customerTypeLabels[customer.type]} />
              </td>
              <td className="px-4 py-3 text-slate-600">{customer.city}</td>
              <td className="px-4 py-3 text-slate-700">{energy ? money.format(energy.monthly_cost_eur) : '-'}</td>
              <td className="px-4 py-3 text-slate-600">{energy?.tariff_type ?? '-'}</td>
              <td className="px-4 py-3">
                <Button asChild size="sm" variant="secondary">
                  <Link to={`/customers/${customer.id}`}>Abrir ficha</Link>
                </Button>
              </td>
            </tr>
          )
        })}
      </DataTable>
    </div>
  )
}
