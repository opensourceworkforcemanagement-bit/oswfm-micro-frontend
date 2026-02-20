/**
 * Auth Bridge - In-memory user state shared across host and MFEs
 *
 * With the BFF/Token Vault pattern, JWTs are stored server-side in the
 * Spring Session — the browser never sees them. This bridge holds only
 * the user identity (populated from the /api/bff/auth/me or /login response)
 * and broadcasts auth state changes to MFEs via CustomEvents.
 *
 * window.__AUTH__ is the singleton; MFEs read from it on mount and listen
 * to 'auth:login' / 'auth:logout' for live updates.
 */

export interface AuthUser {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  userType: string;
}

export interface AuthState {
  user: AuthUser | null;
}

interface AuthBridge {
  getState(): AuthState;
  getUser(): AuthUser | null;
  setUser(user: AuthUser | null): void;
  clear(): void;
}

// Extend Window so TypeScript knows about __AUTH__
declare global {
  interface Window {
    __AUTH__: AuthBridge;
  }
}

function createAuthBridge(): AuthBridge {
  let state: AuthState = { user: null };

  return {
    getState() {
      return state;
    },

    getUser() {
      return state.user;
    },

    setUser(user: AuthUser | null) {
      state = { user };
      if (user) {
        window.dispatchEvent(new CustomEvent('auth:login', { detail: { user } }));
      } else {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    },

    clear() {
      state = { user: null };
      window.dispatchEvent(new CustomEvent('auth:logout'));
    },
  };
}

// Singleton — create once, reuse everywhere
if (!window.__AUTH__) {
  window.__AUTH__ = createAuthBridge();
}

export const authBridge: AuthBridge = window.__AUTH__;
