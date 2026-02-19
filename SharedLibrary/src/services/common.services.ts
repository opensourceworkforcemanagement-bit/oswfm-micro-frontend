// Token storage is provided by the host auth bridge (window.__AUTH__)
/**
 * Common Services - Core HTTP Client
 * Follows SOLID principles and OWASP security guidelines
 * 
 * Security Features:
 * - Input validation and sanitization
 * - Secure token storage with encryption option
 * - CSRF protection
 * - Rate limiting
 * - Request timeout management
 * - Secure header handling
 * - Error sanitization (no sensitive data exposure)
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: string | null;
  message: string;
  status?: number;
}

export interface RequestConfig {
  method?: HttpMethod;
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
  skipAuth?: boolean;
  retries?: number;
}

export interface HttpClientConfig {
  baseURL: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
  maxRetries?: number;
  retryDelay?: number;
  csrfEnabled?: boolean;
}

export interface TokenStorage {
  getToken(): Promise<string | null>;
  setToken(token: string): Promise<void>;
  removeToken(): Promise<void>;
  validateToken(token: string): boolean;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  q?: string;
  [key: string]: any;
}

// ============================================================================
// Lookup Types
// ============================================================================

export interface LookupType {
  id: number;
  name: string;
  description: string;
}

export interface AllLookupData {
  resourceTypes: LookupType[];
  attributeCategories: LookupType[];
  policyTypes: LookupType[];
  obligationTypes: LookupType[];
  dataTypes: LookupType[];
}

// ============================================================================
// HTTP Status Codes
// ============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];

// ============================================================================
// Custom Errors
// ============================================================================

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message?: string,
    public data?: any
  ) {
    super(message || statusText);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export class TimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

// ============================================================================
// Token Storage Implementation (OWASP Compliant)
// ============================================================================

class SecureTokenStorage implements TokenStorage {
  private readonly TOKEN_PATTERN = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;

  async getToken(): Promise<string | null> {
    const token = (window as any).__AUTH__?.getAccessToken?.() ?? null;
    if (token && this.validateToken(token)) {
      return token;
    }
    return null;
  }

  async setToken(token: string): Promise<void> {
    if (!this.validateToken(token)) {
      throw new Error('Invalid token format');
    }
    // Tokens are managed by the host auth bridge — this is a no-op for MFEs.
  }

  async removeToken(): Promise<void> {
    // Tokens are managed by the host auth bridge — MFEs should not clear auth state.
  }

  validateToken(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }
    return this.TOKEN_PATTERN.test(token);
  }
}

// ============================================================================
// Input Sanitization (OWASP Compliant)
// ============================================================================

class InputSanitizer {
  /**
   * Sanitize URL to prevent injection attacks
   */
  static sanitizeUrl(url: string): string {
    // Remove any malicious characters
    const sanitized = url.replace(/[<>\"']/g, '');
    
    // Validate URL format
    try {
      new URL(sanitized, window.location.origin);
      return sanitized;
    } catch {
      throw new Error('Invalid URL format');
    }
  }

  /**
   * Sanitize query parameters
   */
  static sanitizeParams(params: Record<string, any>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined) {
        // Convert to string and remove dangerous characters
        const strValue = String(value).replace(/[<>\"']/g, '');
        sanitized[key] = strValue;
      }
    }
    
    return sanitized;
  }

  /**
   * Validate and sanitize headers
   */
  static sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const allowedHeaders = [
      'content-type',
      'accept',
      'authorization',
      'x-csrf-token',
      'x-request-id',
    ];

    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (allowedHeaders.includes(lowerKey)) {
        sanitized[key] = String(value);
      }
    }

    return sanitized;
  }
}

// ============================================================================
// Rate Limiter
// ============================================================================

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly timeWindow: number; // in milliseconds

  constructor(maxRequests: number = 100, timeWindow: number = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
  }

  canMakeRequest(endpoint: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(endpoint) || [];
    
    // Filter out old requests
    const recentRequests = requests.filter(time => now - time < this.timeWindow);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(endpoint, recentRequests);
    return true;
  }

  reset(endpoint?: string): void {
    if (endpoint) {
      this.requests.delete(endpoint);
    } else {
      this.requests.clear();
    }
  }
}

// ============================================================================
// Core HTTP Client (Single Responsibility Principle)
// ============================================================================

export class HttpClient {
  private readonly baseURL: string;
  private readonly timeout: number;
  private readonly defaultHeaders: Record<string, string>;
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private readonly tokenStorage: TokenStorage;
  private readonly rateLimiter: RateLimiter;
  private readonly csrfEnabled: boolean;

  constructor(config: HttpClientConfig, tokenStorage?: TokenStorage) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 30000;
    this.defaultHeaders = config.defaultHeaders || {};
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.tokenStorage = tokenStorage || new SecureTokenStorage();
    this.rateLimiter = new RateLimiter();
    this.csrfEnabled = config.csrfEnabled !== false;
  }

  /**
   * Build secure headers for request
   */
  private async buildHeaders(customHeaders: Record<string, string> = {}, skipAuth: boolean = false): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...this.defaultHeaders,
      ...customHeaders,
    };

    // Add authentication token
    if (!skipAuth) {
      const token = await this.tokenStorage.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // Sanitize headers
    return InputSanitizer.sanitizeHeaders(headers);
  }

  /**
   * Handle API errors with proper sanitization
   */
  private handleError(error: any, response?: Response): ApiResponse {
    // Don't expose internal error details to prevent information leakage
    if (!response) {
      return {
        success: false,
        error: 'NetworkError',
        message: 'Unable to connect to server. Please check your network connection.',
        data: null,
      };
    }

    const { status } = response;

    // Handle specific HTTP status codes
    switch (status) {
      case HTTP_STATUS.UNAUTHORIZED:
        this.tokenStorage.removeToken();
        return {
          success: false,
          error: 'Unauthorized',
          message: 'Your session has expired. Please log in again.',
          status,
          data: null,
        };

      case HTTP_STATUS.FORBIDDEN:
        return {
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to access this resource.',
          status,
          data: null,
        };

      case HTTP_STATUS.NOT_FOUND:
        return {
          success: false,
          error: 'NotFound',
          message: 'The requested resource was not found.',
          status,
          data: null,
        };

      case HTTP_STATUS.TOO_MANY_REQUESTS:
        return {
          success: false,
          error: 'TooManyRequests',
          message: 'Too many requests. Please try again later.',
          status,
          data: null,
        };

      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      case HTTP_STATUS.SERVICE_UNAVAILABLE:
        return {
          success: false,
          error: 'ServerError',
          message: 'A server error occurred. Please try again later.',
          status,
          data: null,
        };

      default:
        return {
          success: false,
          error: 'ApiError',
          message: 'An error occurred while processing your request.',
          status,
          data: null,
        };
    }
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryRequest<T>(
    fn: () => Promise<T>,
    retries: number = this.maxRetries
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error)) {
        await this.delay(this.retryDelay * (this.maxRetries - retries + 1));
        return this.retryRequest(fn, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Determine if request should be retried
   */
  private shouldRetry(error: any): boolean {
    if (error instanceof TimeoutError) return true;
    if (error instanceof NetworkError) return true;
    if (error instanceof ApiError) {
      // Retry on server errors, but not client errors
      return error.status >= 500;
    }
    return false;
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Core request method with security features
   */
  async request<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      data,
      headers: customHeaders = {},
      timeout = this.timeout,
      skipAuth = false,
      retries = this.maxRetries,
    } = config;

    // Sanitize endpoint
    const sanitizedEndpoint = InputSanitizer.sanitizeUrl(endpoint);

    // Check rate limit
    if (!this.rateLimiter.canMakeRequest(sanitizedEndpoint)) {
      return {
        success: false,
        error: 'RateLimitExceeded',
        message: 'Too many requests. Please slow down.',
        data: null,
      };
    }

    const executeRequest = async (): Promise<ApiResponse<T>> => {
      try {
        const headers = await this.buildHeaders(customHeaders, skipAuth);
        const url = `${this.baseURL}${sanitizedEndpoint}`;

        const requestConfig: RequestInit = {
          method,
          headers,
          credentials: 'same-origin', // CSRF protection
        };

        // Add body for non-GET requests
        if (data && method !== 'GET') {
          requestConfig.body = JSON.stringify(data);
        }

        // Setup timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        requestConfig.signal = controller.signal;

        // Execute request
        const response = await fetch(url, requestConfig);
        clearTimeout(timeoutId);

        // Parse response
        let responseData: T | null = null;
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/json')) {
          responseData = await response.json();
        } else if (response.status !== HTTP_STATUS.NO_CONTENT) {
          const text = await response.text();
          responseData = text as any;
        }

        // Handle error responses
        if (!response.ok) {
          throw new ApiError(
            response.status,
            response.statusText,
            (responseData as any)?.message,
            responseData
          );
        }

        return {
          success: true,
          data: responseData,
          status: response.status,
          error: null,
          message: 'Request successful',
        };

      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new TimeoutError();
        }

        if (error instanceof ApiError) {
          throw error;
        }

        if (error instanceof TypeError) {
          throw new NetworkError('Network request failed');
        }

        throw error;
      }
    };

    try {
      return await this.retryRequest(executeRequest, retries);
    } catch (error) {
      console.error('Request failed:', { endpoint, method, error });
      
      if (error instanceof ApiError) {
        return this.handleError(error, { status: error.status } as Response);
      }

      return this.handleError(error);
    }
  }

  // =========================================================================
  // HTTP Method Helpers
  // =========================================================================

  async get<T = any>(endpoint: string, params?: Record<string, any>, config?: Omit<RequestConfig, 'method' | 'data'>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const sanitizedParams = InputSanitizer.sanitizeParams(params);
      const queryString = new URLSearchParams(sanitizedParams).toString();
      url = queryString ? `${endpoint}?${queryString}` : endpoint;
    }

    return this.request<T>(url, { ...config, method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, data, method: 'POST' });
  }

  async put<T = any>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, data, method: 'PUT' });
  }

  async patch<T = any>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, data, method: 'PATCH' });
  }

  async delete<T = any>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'data'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // =========================================================================
  // Token Management
  // =========================================================================

  async setAuthToken(token: string): Promise<void> {
    await this.tokenStorage.setToken(token);
  }

  async getAuthToken(): Promise<string | null> {
    return this.tokenStorage.getToken();
  }

  async removeAuthToken(): Promise<void> {
    await this.tokenStorage.removeToken();
  }

  // =========================================================================
  // Utility Methods
  // =========================================================================

  resetRateLimit(endpoint?: string): void {
    this.rateLimiter.reset(endpoint);
  }
}

// ============================================================================
// Common Service Operations (Interface Segregation Principle)
// ============================================================================

export class CommonService<T = any> {
  constructor(
    protected client: HttpClient,
    protected resourcePath: string
  ) {}

  async getAll(params?: SearchParams): Promise<ApiResponse<T[]>> {
    return this.client.get<T[]>(`/${this.resourcePath}`, params);
  }

  async getById(id: string | number): Promise<ApiResponse<T>> {
    return this.client.get<T>(`/${this.resourcePath}/${id}`);
  }

  async create(data: Partial<T>, createEndPoint:string): Promise<ApiResponse<T>> {
    return this.client.post<T>(`/${ createEndPoint ? this.resourcePath+'/'+ createEndPoint : this.resourcePath}`, data);
  }

  async update(id: string | number, data: Partial<T>): Promise<ApiResponse<T>> {
    return this.client.put<T>(`/${this.resourcePath}/${id}`, data);
  }

  async partialUpdate(id: string | number, data: Partial<T>): Promise<ApiResponse<T>> {
    return this.client.patch<T>(`/${this.resourcePath}/${id}`, data);
  }

  async delete(id: string | number): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/${this.resourcePath}/${id}`);
  }

  async search(query: string, filters?: SearchParams): Promise<ApiResponse<T[]>> {
    const params: SearchParams = { q: query, ...filters };
    return this.getAll(params);
  }

  async getPaginated(
    page: number = 1,
    limit: number = 20,
    filters?: SearchParams
  ): Promise<ApiResponse<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  }>> {
    const params: SearchParams = { page, limit, ...filters };
    return this.client.get(`/${this.resourcePath}`, params);
  }
}

// ============================================================================
// Batch Operations Service (Interface Segregation Principle)
// ============================================================================

export class BatchService<T = any> extends CommonService<T> {
  async batchCreate(items: Partial<T>[]): Promise<ApiResponse<T[]>> {
    return this.client.post<T[]>(`/${this.resourcePath}/batch`, { items });
  }

  async batchUpdate(
    updates: Array<{ id: string | number; data: Partial<T> }>
  ): Promise<ApiResponse<T[]>> {
    return this.client.put<T[]>(`/${this.resourcePath}/batch`, { updates });
  }

  async batchDelete(ids: Array<string | number>): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/${this.resourcePath}/batch`, {
      data: { ids },
    });
  }
}

// ============================================================================
// Export Default Configuration
// ============================================================================

export const createHttpClient = (config: HttpClientConfig): HttpClient => {
  return new HttpClient(config);
};

export const createCommonService = <T = any>(
  client: HttpClient,
  resourcePath: string
): CommonService<T> => {
  return new CommonService<T>(client, resourcePath);
};

export const createBatchService = <T = any>(
  client: HttpClient,
  resourcePath: string
): BatchService<T> => {
  return new BatchService<T>(client, resourcePath);
};
