import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthUser {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  userType: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(
    () => (window as any).__AUTH__?.getUser?.() ?? null
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const onLogin = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setUser(detail?.user ?? null);
    };
    const onLogout = () => setUser(null);

    window.addEventListener('auth:login', onLogin);
    window.addEventListener('auth:logout', onLogout);

    return () => {
      window.removeEventListener('auth:login', onLogin);
      window.removeEventListener('auth:logout', onLogout);
    };
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
