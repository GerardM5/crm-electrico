import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { DataTable } from '../components/ui/table'
import { leadStatusLabels } from '../config/constants'
import { LeadFormDialog } from '../features/leads/LeadFormDialog'
import { money } from '../lib/formatters'
import { useDemoStore } from '../store/demo-store'

export function LeadsRoute() {
  const { leads, profiles, convertLead } = useDemoStore()

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Captacion comercial con conversion directa a cliente y actividad trazada."
        action={<LeadFormDialog />}
      />
      <DataTable headers={['Lead', 'Origen', 'Estado', 'Factura estimada', 'Asignado', 'Acciones']}>
        {leads.map((lead) => (
          <tr key={lead.id} className="hover:bg-slate-50">
            <td className="px-4 py-3">
              <p className="font-medium text-slate-950">{lead.company_name ?? lead.contact_name}</p>
              <p className="text-xs text-slate-500">
                {lead.contact_name} · {lead.phone ?? lead.email}
              </p>
            </td>
            <td className="px-4 py-3 text-slate-600">{lead.source}</td>
            <td className="px-4 py-3">
              <StatusBadge value={leadStatusLabels[lead.status]} />
            </td>
            <td className="px-4 py-3 text-slate-700">{lead.estimated_monthly_bill ? money.format(lead.estimated_monthly_bill) : '-'}</td>
            <td className="px-4 py-3 text-slate-600">{profiles.find((profile) => profile.id === lead.assigned_to)?.full_name ?? '-'}</td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <LeadFormDialog lead={lead} />
                {lead.status !== 'converted' ? (
                  <Button size="sm" onClick={() => convertLead(lead.id)}>
                    Convertir
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : lead.converted_customer_id ? (
                  <Button asChild size="sm" variant="secondary">
                    <Link to={`/customers/${lead.converted_customer_id}`}>Ver cliente</Link>
                  </Button>
                ) : null}
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  )
}
