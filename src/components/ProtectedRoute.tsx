import { Navigate } from 'react-router';
import { getSession } from '../lib/auth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const session = getSession();
  if (!session) {
    return <Navigate to="/staff/login" replace />;
  }
  return <>{children}</>;
}
