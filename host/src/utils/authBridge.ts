export interface AuthBridge {
  isAuthenticated: () => boolean;
  getUser: () => any;
  getAccessToken: () => string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  onAuthChange: (callback: (user: any) => void) => () => void;
}

export function createAuthBridge(authContext: any): AuthBridge {
  const listeners = new Set<(user: any) => void>();

  // Listen to auth events
  window.addEventListener('auth:login', (e: any) => {
    listeners.forEach(cb => cb(e.detail));
  });

  window.addEventListener('auth:logout', () => {
    listeners.forEach(cb => cb(null));
  });

  return {
    isAuthenticated: () => authContext.isAuthenticated,
    getUser: () => authContext.user,
    getAccessToken: () => authContext.getAccessToken(),
    login: authContext.login,
    logout: authContext.logout,
    onAuthChange: (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
  };
}
