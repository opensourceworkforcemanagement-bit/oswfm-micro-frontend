interface RequestConfig extends RequestInit {
  skipCsrf?: boolean;
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { skipCsrf = false, headers = {}, ...restConfig } = config;
    const method = (restConfig.method ?? 'GET').toUpperCase();

    const url = `${this.baseURL}${endpoint}`;

    const headersObj = new Headers(headers as HeadersInit);
    if (!headersObj.has('Content-Type')) {
      headersObj.set('Content-Type', 'application/json');
    }

    // Attach CSRF token for state-mutating requests
    if (!skipCsrf && MUTATING_METHODS.has(method)) {
      const csrf = getCsrfToken();
      if (csrf) {
        headersObj.set('X-XSRF-TOKEN', csrf);
      }
    }

    try {
      const response = await fetch(url, {
        ...restConfig,
        method,
        headers: headersObj,
        credentials: 'include',
      });

      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as any).message || `HTTP Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  post<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  patch<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

export const apiClient = new APIClient('http://localhost:1110/api');
