import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authBridge, AuthUser } from '../services/authBridge';

const BFF_BASE = 'http://localhost:1110';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userName: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: check whether the server session is still valid
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const response = await fetch(`${BFF_BASE}/api/bff/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const userInfo: AuthUser = await response.json();
        setUser(userInfo);
        authBridge.setUser(userInfo);
      } else {
        setUser(null);
        authBridge.clear();
      }
    } catch {
      setUser(null);
      authBridge.clear();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userName: string, password: string) => {
    const response = await fetch(`${BFF_BASE}/api/bff/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': getCsrfToken(),
      },
      credentials: 'include',
      body: JSON.stringify({ userName, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const userInfo: AuthUser = await response.json();
    setUser(userInfo);
    authBridge.setUser(userInfo);
  };

  const logout = async () => {
    try {
      await fetch(`${BFF_BASE}/api/bff/auth/logout`, {
        method: 'POST',
        headers: { 'X-XSRF-TOKEN': getCsrfToken() },
        credentials: 'include',
      });
    } catch {
      // ignore upstream errors — always clear local state
    } finally {
      setUser(null);
      authBridge.clear();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
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
