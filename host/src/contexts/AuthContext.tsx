import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  email?: string;
  roles?: string[];
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number;
}

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
const API_BASE_URL = 'http://localhost:3000/api';
const TOKEN_REFRESH_BUFFER = 60000; // Refresh 1 minute before expiry

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  // Setup automatic token refresh
  useEffect(() => {
    if (tokens) {
      const timeUntilRefresh = tokens.expiresAt - Date.now() - TOKEN_REFRESH_BUFFER;
      
      if (timeUntilRefresh > 0) {
        const refreshTimer = setTimeout(() => {
          refreshToken();
        }, timeUntilRefresh);

        return () => clearTimeout(refreshTimer);
      } else {
        // Token expired or about to expire, refresh immediately
        refreshToken();
      }
    }
  }, [tokens]);

  const checkExistingSession = async () => {
    try {
      // Check if there's a stored session
      const storedUser = sessionStorage.getItem('userInfo');
      
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Try to refresh token to validate session
        await refreshToken();
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
      clearSession();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string, rememberMe = false) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password, rememberMe }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      
      // Store tokens
      const authTokens: AuthTokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
        expiresAt: Date.now() + (data.expiresIn * 1000),
      };

      setTokens(authTokens);
      setUser(data.user);

      // Store non-sensitive user info
      if (rememberMe) {
        sessionStorage.setItem('userInfo', JSON.stringify(data.user));
      }

      // Broadcast login event to other microfrontends
      window.dispatchEvent(new CustomEvent('auth:login', { detail: data.user }));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (tokens?.accessToken) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
          },
          credentials: 'include',
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearSession();
      // Broadcast logout event to other microfrontends
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  };

  const refreshToken = async () => {
    try {
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.refreshToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      const newTokens: AuthTokens = {
        ...tokens,
        accessToken: data.accessToken,
        expiresIn: data.expiresIn,
        expiresAt: Date.now() + (data.expiresIn * 1000),
      };

      setTokens(newTokens);

      // Broadcast token refresh event
      window.dispatchEvent(new CustomEvent('auth:token-refreshed', { 
        detail: { accessToken: data.accessToken } 
      }));
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout user
      await logout();
    }
  };

  const getAccessToken = (): string | null => {
    return tokens?.accessToken || null;
  };

  const clearSession = () => {
    setUser(null);
    setTokens(null);
    sessionStorage.removeItem('userInfo');
  };

  const value: AuthContextType = {
    user,
    tokens,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshToken,
    getAccessToken,
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