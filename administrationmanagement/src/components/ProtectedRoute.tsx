import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // if (!isAuthenticated) {
  //   // Redirect to login with return URL
  //   return <Navigate to="/login" state={{ from: location }} replace />;
  // }

  // // Check role-based access
  // if (requiredRoles.length > 0 && user?.roles) {
  //   const hasRequiredRole = requiredRoles.some(role => 
  //     user.roles?.includes(role)
  //   );

  //   if (!hasRequiredRole) {
  //     return <Navigate to="/unauthorized" replace />;
  //   }
  // }

  return <>{children}</>;
};