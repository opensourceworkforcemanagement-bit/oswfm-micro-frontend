/**
 * Auth Bridge - In-memory token management shared across host and MFEs
 *
 * Tokens are stored ONLY in memory (on window.__AUTH__) — never in
 * localStorage, sessionStorage, or IndexedDB.  The host writes tokens
 * after login; MFEs read them through the same global.
 *
 * Custom events are dispatched so MFEs can react to auth state changes
 * without polling.
 */

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
}

export interface AuthUser {
  userId: string;
  username: string;
}

export interface AuthState {
  tokens: AuthTokens | null;
  user: AuthUser | null;
}

interface AuthBridge {
  getState(): AuthState;
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  getUser(): AuthUser | null;
  setTokens(tokens: AuthTokens): void;
  clear(): void;
}

// Extend Window so TypeScript knows about __AUTH__
declare global {
  interface Window {
    __AUTH__: AuthBridge;
  }
}

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const base64 = token.split('.')[1];
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function extractUser(accessToken: string): AuthUser | null {
  const payload = decodeJwtPayload(accessToken);
  if (!payload) return null;
  return {
    userId: String(payload.userId ?? ''),
    username: String(payload.username ?? ''),
  };
}

function createAuthBridge(): AuthBridge {
  let state: AuthState = { tokens: null, user: null };

  return {
    getState() {
      return state;
    },

    getAccessToken() {
      return state.tokens?.accessToken ?? null;
    },

    getRefreshToken() {
      return state.tokens?.refreshToken ?? null;
    },

    getUser() {
      return state.user;
    },

    setTokens(tokens: AuthTokens) {
      const user = extractUser(tokens.accessToken);
      state = { tokens, user };
      window.dispatchEvent(new CustomEvent('auth:login', { detail: { tokens, user } }));
    },

    clear() {
      state = { tokens: null, user: null };
      window.dispatchEvent(new CustomEvent('auth:logout'));
    },
  };
}

// Singleton — create once, reuse everywhere
if (!window.__AUTH__) {
  window.__AUTH__ = createAuthBridge();
}

export const authBridge: AuthBridge = window.__AUTH__;
