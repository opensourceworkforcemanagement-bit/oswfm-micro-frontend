interface RequestConfig extends RequestInit {
  skipAuth?: boolean;
}

class APIClient {
  private baseURL: string;
  private getAccessToken: (() => string | null) | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setTokenGetter(getter: () => string | null) {
    this.getAccessToken = getter;
  }

  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { skipAuth = false, headers = {}, ...restConfig } = config;

    const url = `${this.baseURL}${endpoint}`;
    
    const headersObj = new Headers(headers as HeadersInit);
    // Ensure default content type
    if (!headersObj.has('Content-Type')) {
      headersObj.set('Content-Type', 'application/json');
    }

    // Add Authorization header if not skipped
    if (!skipAuth && this.getAccessToken) {
      const token = this.getAccessToken();
      if (token) {
        headersObj.set('Authorization', `Bearer ${token}`);
      }
    }

    try {
      const response = await fetch(url, {
        ...restConfig,
        headers: headersObj,
        credentials: 'include',
      });

      // Handle 401 Unauthorized - trigger refresh or logout
      if (response.status === 401 && !skipAuth) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP Error: ${response.status}`);
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

  delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

export const apiClient = new APIClient(  
     'http://localhost:1110/api'
);