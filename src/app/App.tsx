import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from '../components/feedback/ErrorBoundary'
import { PageSkeleton } from '../components/feedback/Skeleton'
import { AppShell } from '../components/layout/AppShell'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'

const LoginRoute = lazy(() => import('../routes/login').then((m) => ({ default: m.LoginRoute })))
const DashboardRoute = lazy(() => import('../routes/dashboard').then((m) => ({ default: m.DashboardRoute })))
const CustomersRoute = lazy(() => import('../routes/customers').then((m) => ({ default: m.CustomersRoute })))
const CustomerDetailRoute = lazy(() => import('../routes/customer-detail').then((m) => ({ default: m.CustomerDetailRoute })))
const RenewalsRoute = lazy(() => import('../routes/renewals').then((m) => ({ default: m.RenewalsRoute })))
const DocumentsRoute = lazy(() => import('../routes/documents').then((m) => ({ default: m.DocumentsRoute })))
const SettingsRoute = lazy(() => import('../routes/settings').then((m) => ({ default: m.SettingsRoute })))
const LeadsRoute = lazy(() => import('../routes/leads').then((m) => ({ default: m.LeadsRoute })))
const DealsRoute = lazy(() => import('../routes/deals').then((m) => ({ default: m.DealsRoute })))
const TasksRoute = lazy(() => import('../routes/tasks').then((m) => ({ default: m.TasksRoute })))
const ContractsRoute = lazy(() => import('../routes/contracts').then((m) => ({ default: m.ContractsRoute })))
const InstallationsRoute = lazy(() => import('../routes/installations').then((m) => ({ default: m.InstallationsRoute })))
const InvoicesRoute = lazy(() => import('../routes/invoices').then((m) => ({ default: m.InvoicesRoute })))
const ProposalsRoute = lazy(() => import('../routes/proposals').then((m) => ({ default: m.ProposalsRoute })))
const SimulationsRoute = lazy(() => import('../routes/simulations').then((m) => ({ default: m.SimulationsRoute })))
const PipelineRoute = lazy(() => import('../routes/pipeline').then((m) => ({ default: m.PipelineRoute })))

const routeFallback = <PageSkeleton kpis={0} tableRows={8} />

export function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <Suspense fallback={<PageSkeleton kpis={0} tableRows={0} />}>
            <LoginRoute />
          </Suspense>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Suspense fallback={<PageSkeleton kpis={4} tableRows={6} />}><ErrorBoundary level="page"><DashboardRoute /></ErrorBoundary></Suspense>} />
        <Route path="/customers" element={<Suspense fallback={routeFallback}><ErrorBoundary level="page"><CustomersRoute /></ErrorBoundary></Suspense>} />
        <Route path="/customers/:id" element={<Suspense fallback={<PageSkeleton kpis={4} tableRows={4} tableCols={3} />}><ErrorBoundary level="page"><CustomerDetailRoute /></ErrorBoundary></Suspense>} />
        <Route path="/renewals" element={<Suspense fallback={routeFallback}><ErrorBoundary level="page"><RenewalsRoute /></ErrorBoundary></Suspense>} />
        <Route path="/documents" element={<Suspense fallback={routeFallback}><ErrorBoundary level="page"><DocumentsRoute /></ErrorBoundary></Suspense>} />
        <Route path="/leads" element={<Suspense fallback={routeFallback}><ErrorBoundary level="page"><LeadsRoute /></ErrorBoundary></Suspense>} />
        <Route path="/deals" element={<Suspense fallback={routeFallback}><ErrorBoundary level="page"><DealsRoute /></ErrorBoundary></Suspense>} />
        <Route path="/tasks" element={<Suspense fallback={routeFallback}><ErrorBoundary level="page"><TasksRoute /></ErrorBoundary></Suspense>} />
        <Route path="/contracts" element={<Suspense fallback={routeFallback}><ErrorBoundary level="page"><ContractsRoute /></ErrorBoundary></Suspense>} />
        <Route path="/installations" element={<Suspense fallback={routeFallback}><ErrorBoundary level="page"><InstallationsRoute /></ErrorBoundary></Suspense>} />
        <Route path="/invoices" element={<Suspense fallback={routeFallback}><ErrorBoundary level="page"><InvoicesRoute /></ErrorBoundary></Suspense>} />
        <Route path="/proposals" element={<Suspense fallback={routeFallback}><ErrorBoundary level="page"><ProposalsRoute /></ErrorBoundary></Suspense>} />
        <Route path="/simulations" element={<Suspense fallback={routeFallback}><ErrorBoundary level="page"><SimulationsRoute /></ErrorBoundary></Suspense>} />
        <Route path="/pipeline" element={<Suspense fallback={routeFallback}><ErrorBoundary level="page"><PipelineRoute /></ErrorBoundary></Suspense>} />
        <Route path="/settings" element={<Navigate to="/settings/appearance" replace />} />
        <Route path="/settings/:tab" element={<Suspense fallback={<PageSkeleton kpis={0} tableRows={4} />}><ErrorBoundary level="page"><SettingsRoute /></ErrorBoundary></Suspense>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
