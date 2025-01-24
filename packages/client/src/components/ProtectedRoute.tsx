import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SplashScreen } from './SplashScreen';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}; 