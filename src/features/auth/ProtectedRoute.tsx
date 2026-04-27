import { Navigate, useLocation } from 'react-router-dom'
import { useDemoStore } from '../../store/demo-store'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useDemoStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
