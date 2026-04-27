import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'
import { ContractsRoute } from '../routes/contracts'
import { CustomerDetailRoute } from '../routes/customer-detail'
import { CustomersRoute } from '../routes/customers'
import { DashboardRoute } from '../routes/dashboard'
import { DealsRoute } from '../routes/deals'
import { DocumentsRoute } from '../routes/documents'
import { InstallationsRoute } from '../routes/installations'
import { InvoicesRoute } from '../routes/invoices'
import { LeadsRoute } from '../routes/leads'
import { LoginRoute } from '../routes/login'
import { PipelineRoute } from '../routes/pipeline'
import { ProposalsRoute } from '../routes/proposals'
import { SettingsRoute } from '../routes/settings'
import { SimulationsRoute } from '../routes/simulations'
import { TasksRoute } from '../routes/tasks'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardRoute />} />
        <Route path="/leads" element={<LeadsRoute />} />
        <Route path="/customers" element={<CustomersRoute />} />
        <Route path="/customers/:id" element={<CustomerDetailRoute />} />
        <Route path="/deals" element={<DealsRoute />} />
        <Route path="/pipeline" element={<PipelineRoute />} />
        <Route path="/invoices" element={<InvoicesRoute />} />
        <Route path="/simulations" element={<SimulationsRoute />} />
        <Route path="/proposals" element={<ProposalsRoute />} />
        <Route path="/contracts" element={<ContractsRoute />} />
        <Route path="/installations" element={<InstallationsRoute />} />
        <Route path="/tasks" element={<TasksRoute />} />
        <Route path="/documents" element={<DocumentsRoute />} />
        <Route path="/settings" element={<SettingsRoute />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
