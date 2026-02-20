// services/api.ts

// Type definitions
export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: string | null;
  message: string;
  status?: number;
}

export interface LoginCredentials {
  userName: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface User {
  id: string | number;
  firstName: string;
  lastName: string;
  email: string;
  bio?: string;
  phone?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string | number;
  title: string;
  content: string;
  author?: {
    id: string | number;
    name: string;
  };
  tags: string[];
  category?: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  q?: string;
  category?: string;
  status?: string;
  [key: string]: any;
}

export interface FileUpload {
  uri: string;
  type: string;
  name: string;
}

export interface BatchOperation<T> {
  items?: T[];
  updates?: Array<{ id: string | number; data: Partial<T> }>;
  ids?: Array<string | number>;
}

// API Configuration
const API_BASE_URL: string = 'http://localhost:1110/api/v1/authentication';
const API_VERSION: string = 'v1';
//const API_URL: string = `${API_BASE_URL}/${API_VERSION}`;
const API_URL: string = `${API_BASE_URL}`;


// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  customHeaders?: Record<string, string>;
  timeout?: number;
}

class ApiService {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_URL;
    this.timeout = 10000;
  }

  // Build request headers — no Bearer token (session cookie handles auth)
  private buildHeaders(method: string, customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...customHeaders,
    };

    const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
    if (mutating) {
      const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
      if (match) {
        headers['X-XSRF-TOKEN'] = decodeURIComponent(match[1]);
      }
    }

    return headers;
  }

  // Handle API errors
  private handleApiError(error: Error, response?: Response): ApiResponse {
    if (!response) {
      return {
        success: false,
        error: 'Network error',
        message: 'Unable to connect to server',
        data: null,
      };
    }

    const { status } = response;
    
    switch (status) {
      case HTTP_STATUS.UNAUTHORIZED:
        return {
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
          data: null,
        };
      case HTTP_STATUS.FORBIDDEN:
        return {
          success: false,
          error: 'Forbidden',
          message: 'Access denied',
          data: null,
        };
      case HTTP_STATUS.NOT_FOUND:
        return {
          success: false,
          error: 'Not Found',
          message: 'Resource not found',
          data: null,
        };
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
        return {
          success: false,
          error: 'Server Error',
          message: 'Internal server error',
          data: null,
        };
      default:
        return {
          success: false,
          error: 'API Error',
          message: error.message || 'Something went wrong',
          data: null,
        };
    }
  }

  // Generic API request method
  async apiRequest<T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { method = 'GET', data, customHeaders, timeout } = options;

    try {
      const headers = this.buildHeaders(method, customHeaders);
      const url = `${this.baseURL}${endpoint}`;
      
      console.log(`API Request: ${method} -> ${url}`);

      const config: RequestInit = {
        method,
        headers,
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.body = JSON.stringify(data);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout || this.timeout);
      
      config.signal = controller.signal;

      console.log(`API Request: ${config} -> ${url}`);
      const response = await fetch(url, { ...config, credentials: 'include' });
      clearTimeout(timeoutId);

      let responseData: T | null = null;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else if (response.status !== HTTP_STATUS.NO_CONTENT) {
        responseData = await response.text() as any;
      }

      if (!response.ok) {
        throw new Error((responseData as any)?.message || `HTTP ${response.status}`);
      }

      return {
        success: true,
        data: responseData,
        status: response.status,
        error: null,
        message: 'Request successful',
      };

    } catch (error) {
      console.error('API Request Error:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Timeout',
          message: 'Request timeout',
          data: null,
        };
      }

      return this.handleApiError(error as Error, (error as any).response);
    }
  }

  // Authentication Methods
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ token: string; user: User }>> {
    return await this.apiRequest<{ token: string; user: User }>('/users/login', {
      method: 'POST',
      data: credentials,
    });
  }

  async register(userData: RegisterData): Promise<ApiResponse<{ user: User }>> {
    return await this.apiRequest<{ user: User }>('/auth/register', {
      method: 'POST',
      data: userData,
    });
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.apiRequest('/auth/logout', {
      method: 'POST',
    });
    
    // Clear token regardless of response
    await this.removeAuthToken();
    return response;
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return await this.apiRequest<{ token: string }>('/auth/refresh', {
      method: 'POST',
    });
  }

  // Generic CRUD Operations
  
  // CREATE - Add new resource
  async create<T = any>(resource: string, data: Partial<T>): Promise<ApiResponse<T>> {
    return await this.apiRequest<T>(`/${resource}`, {
      method: 'POST',
      data,
    });
  }

  // READ - Get all resources with optional query parameters
  async getAll<T = any>(resource: string, params: SearchParams = {}): Promise<ApiResponse<T[]>> {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    const endpoint = queryString ? `/${resource}?${queryString}` : `/${resource}`;
    
    return await this.apiRequest<T[]>(endpoint, {
      method: 'GET',
    });
  }

  // READ - Get single resource by ID
  async getById<T = any>(resource: string, id: string | number): Promise<ApiResponse<T>> {
    return await this.apiRequest<T>(`/${resource}/${id}`, {
      method: 'GET',
    });
  }

  // UPDATE - Full update of resource
  async update<T = any>(resource: string, id: string | number, data: Partial<T>): Promise<ApiResponse<T>> {
    return await this.apiRequest<T>(`/${resource}/${id}`, {
      method: 'PUT',
      data,
    });
  }

  // UPDATE - Partial update of resource
  async patch<T = any>(resource: string, id: string | number, data: Partial<T>): Promise<ApiResponse<T>> {
    return await this.apiRequest<T>(`/${resource}/${id}`, {
      method: 'PATCH',
      data,
    });
  }

  // DELETE - Remove resource
  async delete(resource: string, id: string | number): Promise<ApiResponse> {
    return await this.apiRequest(`/${resource}/${id}`, {
      method: 'DELETE',
    });
  }

  // Batch operations
  async batchCreate<T = any>(resource: string, dataArray: Partial<T>[]): Promise<ApiResponse<T[]>> {
    return await this.apiRequest<T[]>(`/${resource}/batch`, {
      method: 'POST',
      data: { items: dataArray },
    });
  }

  async batchUpdate<T = any>(
    resource: string, 
    updates: Array<{ id: string | number; data: Partial<T> }>
  ): Promise<ApiResponse<T[]>> {
    return await this.apiRequest<T[]>(`/${resource}/batch`, {
      method: 'PUT',
      data: { updates },
    });
  }

  async batchDelete(resource: string, ids: Array<string | number>): Promise<ApiResponse> {
    return await this.apiRequest(`/${resource}/batch`, {
      method: 'DELETE',
      data: { ids },
    });
  }

  // File upload
  async uploadFile(
    endpoint: string,
    file: FileUpload,
    additionalData: Record<string, any> = {}
  ): Promise<ApiResponse<{ imageUrl: string; fileId: string }>> {
    try {
      const formData = new FormData();

      formData.append('file', {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.name || 'upload.jpg',
      } as any);

      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });

      const csrfMatch = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
      const headers: Record<string, string> = {
        'Content-Type': 'multipart/form-data',
      };
      if (csrfMatch) {
        headers['X-XSRF-TOKEN'] = decodeURIComponent(csrfMatch[1]);
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.message || `HTTP ${response.status}`);
      }

      return {
        success: true,
        data: responseData,
        error: null,
        message: 'File uploaded successfully',
      };

    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        error: 'Upload Error',
        message: (error as Error).message || 'File upload failed',
        data: null,
      };
    }
  }

  // Search functionality
  async search<T = any>(resource: string, query: string, filters: SearchParams = {}): Promise<ApiResponse<T[]>> {
    const params: SearchParams = {
      q: query,
      ...filters,
    };
    
    return await this.getAll<T>(resource, params);
  }

  // Pagination helper
  async getPaginated<T = any>(
    resource: string, 
    page: number = 1, 
    limit: number = 20, 
    filters: SearchParams = {}
  ): Promise<ApiResponse<{ data: T[]; pagination: { page: number; limit: number; total: number; hasMore: boolean } }>> {
    const params: SearchParams = {
      page,
      limit,
      ...filters,
    };
    
    return await this.getAll(resource, params);
  }
}

// Create and export singleton instance
const apiService = new ApiService();

// Specific resource services
export class UserService {
  static async getProfile(): Promise<ApiResponse<User>> {
    return await apiService.getById<User>('users', 'me');
  }

  static async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return await apiService.patch<User>('users', 'me', data);
  }

  static async changePassword(passwordData: { 
    currentPassword: string; 
    newPassword: string; 
  }): Promise<ApiResponse> {
    return await apiService.apiRequest('/users/change-password', {
      method: 'POST',
      data: passwordData,
    });
  }

  static async getAllUsers(params?: SearchParams): Promise<ApiResponse<User[]>> {
    return await apiService.getAll<User>('users', params);
  }

  static async getUserById(id: string | number): Promise<ApiResponse<User>> {
    return await apiService.getById<User>('users', id);
  }
}

export class PostService {
  static async getAllPosts(params?: SearchParams): Promise<ApiResponse<Post[]>> {
    return await apiService.getAll<Post>('posts', params);
  }

  static async getPostById(id: string | number): Promise<ApiResponse<Post>> {
    return await apiService.getById<Post>('posts', id);
  }

  static async createPost(postData: Partial<Post>): Promise<ApiResponse<Post>> {
    return await apiService.create<Post>('posts', postData);
  }

  static async updatePost(id: string | number, postData: Partial<Post>): Promise<ApiResponse<Post>> {
    return await apiService.update<Post>('posts', id, postData);
  }

  static async deletePost(id: string | number): Promise<ApiResponse> {
    return await apiService.delete('posts', id);
  }

  static async searchPosts(query: string, filters?: SearchParams): Promise<ApiResponse<Post[]>> {
    return await apiService.search<Post>('posts', query, filters);
  }
}

// Export main API service and utilities
export { API_URL, apiService as default };

// Usage Examples with TypeScript:
/*

// 1. Authentication with proper typing
import apiService, { UserService, LoginCredentials, User } from './services/api';

const handleLogin = async (): Promise<void> => {
  const credentials: LoginCredentials = {
    email: 'user@example.com',
    password: 'password123'
  };
  
  const response = await apiService.login(credentials);
  
  if (response.success) {
    console.log('Login successful:', response.data?.user);
  } else {
    console.error('Login failed:', response.message);
  }
};

// 2. CRUD Operations with type safety
const handleCreatePost = async (): Promise<void> => {
  const newPost: Partial<Post> = {
    title: 'My New Post',
    content: 'This is the content of my post',
    tags: ['react-native', 'expo'],
    status: 'draft'
  };
  
  const response = await apiService.create<Post>('posts', newPost);
  
  if (response.success) {
    console.log('Post created:', response.data?.title);
  } else {
    console.error('Failed to create post:', response.message);
  }
};

// 3. Get all posts with pagination and type safety
const handleGetPosts = async (): Promise<void> => {
  const response = await apiService.getPaginated<Post>('posts', 1, 10, {
    status: 'published'
  });
  
  if (response.success && response.data) {
    console.log('Posts:', response.data.data);
    console.log('Has more:', response.data.pagination.hasMore);
  }
};

// 4. File upload with proper types
const handleFileUpload = async (file: FileUpload): Promise<void> => {
  const response = await apiService.uploadFile('/upload/image', file, {
    description: 'Profile picture'
  });
  
  if (response.success) {
    console.log('File uploaded:', response.data?.imageUrl);
  }
};

// 5. Using specific services with type safety
const handleGetProfile = async (): Promise<void> => {
  const response = await UserService.getProfile();
  
  if (response.success && response.data) {
    const user: User = response.data;
    console.log('User profile:', `${user.firstName} ${user.lastName}`);
  }
};

*/