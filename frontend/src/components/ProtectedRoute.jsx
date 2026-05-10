import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute
 * Wraps any route that requires authentication.
 * If no JWT token is found in localStorage, redirects to /login.
 */
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
