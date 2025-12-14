import React, { useState } from 'react';
import { FileText, Folder, ChevronRight, ChevronDown } from 'lucide-react';

// Project structure visualization
const projectStructure = {
  name: 'project-root',
  type: 'folder',
  children: [
    {
      name: 'src',
      type: 'folder',
      children: [
        {
          name: 'types',
          type: 'folder',
          children: [
            { name: 'common.types.ts', type: 'file', description: 'Shared interfaces and types' },
            { name: 'api.types.ts', type: 'file', description: 'API request/response types' },
            { name: 'user.types.ts', type: 'file', description: 'User management types' },
            { name: 'workcode.types.ts', type: 'file', description: 'Work code management types' },
            { name: 'auth.types.ts', type: 'file', description: 'Authentication types' },
            { name: 'config.types.ts', type: 'file', description: 'Configuration types' }
          ]
        },
        {
          name: 'services',
          type: 'folder',
          children: [
            { name: 'api.service.ts', type: 'file', description: 'Base API service with HTTP methods' },
            { name: 'auth.service.ts', type: 'file', description: 'Authentication service' },
            { name: 'user.service.ts', type: 'file', description: 'User management API calls' },
            { name: 'workcode.service.ts', type: 'file', description: 'Work code API calls' },
            { name: 'security.service.ts', type: 'file', description: 'Security validation utilities' }
          ]
        },
        {
          name: 'config',
          type: 'folder',
          children: [
            { name: 'config.manager.ts', type: 'file', description: 'Configuration management' },
            { name: 'user.config.ts', type: 'file', description: 'User management configuration' },
            { name: 'workcode.config.ts', type: 'file', description: 'Work code configuration' }
          ]
        },
        {
          name: 'theme',
          type: 'folder',
          children: [
            { name: 'tokens', type: 'folder', children: [
              { name: 'index.css', type: 'file', description: 'Design tokens' }
            ]},
            { name: 'themes', type: 'folder', children: [
              { name: 'light.css', type: 'file', description: 'Light theme' },
              { name: 'dark.css', type: 'file', description: 'Dark theme' },
              { name: 'brand-a.css', type: 'file', description: 'Brand A theme' }
            ]},
            { name: 'ThemeProvider.tsx', type: 'file', description: 'Theme context provider' },
            { name: 'useTheme.ts', type: 'file', description: 'Theme hook' }
          ]
        },
        {
          name: 'components',
          type: 'folder',
          children: [
            { name: 'common', type: 'folder', children: [
              { name: 'InputField.tsx', type: 'file', description: 'Themed input component' },
              { name: 'SelectField.tsx', type: 'file', description: 'Themed select component' },
              { name: 'Button.tsx', type: 'file', description: 'Themed button component' },
              { name: 'StatusBadge.tsx', type: 'file', description: 'Status badge component' }
            ]},
            { name: 'UserManagement', type: 'folder', children: [
              { name: 'UserDirectory.tsx', type: 'file', description: 'User list view' },
              { name: 'UserForm.tsx', type: 'file', description: 'User create/edit form' }
            ]},
            { name: 'WorkCodeManagement', type: 'folder', children: [
              { name: 'WorkCodeList.tsx', type: 'file', description: 'Work code list' },
              { name: 'WorkCodeForm.tsx', type: 'file', description: 'Work code form' }
            ]},
            { name: 'Auth', type: 'folder', children: [
              { name: 'LoginPage.tsx', type: 'file', description: 'Login page component' }
            ]}
          ]
        },
        {
          name: 'pages',
          type: 'folder',
          children: [
            { name: 'Dashboard.tsx', type: 'file', description: 'Dashboard page' },
            { name: 'Users.tsx', type: 'file', description: 'User management page' },
            { name: 'WorkCodes.tsx', type: 'file', description: 'Work code page' },
            { name: 'Settings.tsx', type: 'file', description: 'Settings page' }
          ]
        },
        {
          name: 'store',
          type: 'folder',
          children: [
            { name: 'auth.store.ts', type: 'file', description: 'Auth Zustand store' },
            { name: 'shared.store.ts', type: 'file', description: 'Shared state store' }
          ]
        },
        { name: 'App.tsx', type: 'file', description: 'Main application component' },
        { name: 'index.tsx', type: 'file', description: 'Application entry point' }
      ]
    },
    { name: 'package.json', type: 'file', description: 'Dependencies' },
    { name: 'tsconfig.json', type: 'file', description: 'TypeScript config' }
  ]
};

const FileTree = ({ node, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(level < 2);
  const isFolder = node.type === 'folder';

  return (
    <div style={{ marginLeft: `${level * 20}px` }}>
      <div
        onClick={() => isFolder && setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 8px',
          cursor: isFolder ? 'pointer' : 'default',
          backgroundColor: isFolder ? 'transparent' : '#f8fafc',
          borderRadius: '4px',
          marginBottom: '2px',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => {
          if (isFolder) e.currentTarget.style.backgroundColor = '#f1f5f9';
        }}
        onMouseLeave={(e) => {
          if (isFolder) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {isFolder && (
          isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
        )}
        {isFolder ? (
          <Folder size={16} color="#3b82f6" />
        ) : (
          <FileText size={16} color="#64748b" />
        )}
        <span style={{ 
          fontWeight: isFolder ? 600 : 400,
          fontSize: '14px',
          color: isFolder ? '#1e293b' : '#475569'
        }}>
          {node.name}
        </span>
        {node.description && (
          <span style={{ 
            fontSize: '12px', 
            color: '#94a3b8',
            marginLeft: '8px'
          }}>
            - {node.description}
          </span>
        )}
      </div>
      {isFolder && isOpen && node.children && (
        <div>
          {node.children.map((child, idx) => (
            <FileTree key={idx} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const FileContent = ({ filename, content }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: '#1e293b',
        color: 'white',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '14px'
      }}>
        <span>{filename}</span>
        <button
          onClick={handleCopy}
          style={{
            padding: '4px 12px',
            backgroundColor: isCopied ? '#22c55e' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          {isCopied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre style={{
        margin: 0,
        padding: '16px',
        backgroundColor: '#f8fafc',
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px',
        overflow: 'auto',
        maxHeight: '500px',
        fontSize: '13px',
        lineHeight: '1.6'
      }}>
        <code>{content}</code>
      </pre>
    </div>
  );
};

export default function ProjectStructure() {
  const [selectedTab, setSelectedTab] = useState('structure');

  const files = {
    'common.types.ts': `// src/types/common.types.ts

export interface FieldConfig {
  enabled: boolean;
  readonly: boolean;
  visible: boolean;
  label: string;
  hint: string;
  required: boolean;
}

export interface ColumnConfig {
  visible: boolean;
  label: string;
}

export interface ActionConfig {
  enabled: boolean;
  visible: boolean;
}

export interface PaginationConfig {
  enabled: boolean;
  defaultPageSize: number;
  pageSizeOptions: number[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: string | null;
  message: string;
  status?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  q?: string;
  [key: string]: any;
}`,

    'user.types.ts': `// src/types/user.types.ts
import { FieldConfig, ColumnConfig, ActionConfig, PaginationConfig } from './common.types';

export interface User {
  id: number;
  userName: string;
  firstName: string;
  lastName: string;
  role: string;
  org: string;
  status: string;
  hiringDate: string;
  lastDate: string;
  workerType: string;
}

export interface UserPageConfig {
  columns: Record<string, ColumnConfig>;
  fields: Record<string, FieldConfig>;
  filters: Record<string, FieldConfig>;
  roles: Record<string, { enabled: boolean; visible: boolean; label: string }>;
  workerTypes: Record<string, { enabled: boolean; visible: boolean; label: string }>;
  actions: Record<string, ActionConfig>;
  pagination: PaginationConfig;
}`,

    'workcode.types.ts': `// src/types/workcode.types.ts
import { FieldConfig, ColumnConfig, ActionConfig } from './common.types';

export interface WorkCode {
  work_code_id: number;
  prefix: string;
  suffix: string;
  short_work_code: string;
  long_work_code: string;
  description: string;
  status: number;
}

export interface WorkCodePageConfig {
  columns: Record<string, ColumnConfig>;
  fields: Record<string, FieldConfig>;
  actions: Record<string, ActionConfig>;
}`,

    'auth.types.ts': `// src/types/auth.types.ts

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string | number;
    email: string;
    name: string;
  };
  message?: string;
}

export interface AuthState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}`,

    'api.service.ts': `// src/services/api.service.ts
import localforage from 'localforage';
import { ApiResponse } from '../types/common.types';

const API_BASE_URL = 'http://localhost:1110/api/v1';

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
    this.baseURL = API_BASE_URL;
    this.timeout = 10000;
  }

  async getAuthToken(): Promise<string | null> {
    try {
      return await localforage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async setAuthToken(token: string): Promise<void> {
    try {
      await localforage.setItem('authToken', token);
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
  }

  async removeAuthToken(): Promise<void> {
    try {
      await localforage.removeItem('authToken');
    } catch (error) {
      console.error('Error removing auth token:', error);
    }
  }

  private async buildHeaders(customHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
    const token = await this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...customHeaders,
    };

    if (token) {
      headers.Authorization = \`Bearer \${token}\`;
    }

    return headers;
  }

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
        this.removeAuthToken();
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
      default:
        return {
          success: false,
          error: 'API Error',
          message: error.message || 'Something went wrong',
          data: null,
        };
    }
  }

  async apiRequest<T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { method = 'GET', data, customHeaders, timeout } = options;
    
    try {
      const headers = await this.buildHeaders(customHeaders);
      const url = \`\${this.baseURL}\${endpoint}\`;
      
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

      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      let responseData: T | null = null;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else if (response.status !== HTTP_STATUS.NO_CONTENT) {
        responseData = await response.text() as any;
      }

      if (!response.ok) {
        throw new Error((responseData as any)?.message || \`HTTP \${response.status}\`);
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

  // Generic CRUD operations
  async create<T = any>(resource: string, data: Partial<T>): Promise<ApiResponse<T>> {
    return await this.apiRequest<T>(\`/\${resource}\`, { method: 'POST', data });
  }

  async getAll<T = any>(resource: string, params: Record<string, any> = {}): Promise<ApiResponse<T[]>> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? \`/\${resource}?\${queryString}\` : \`/\${resource}\`;
    return await this.apiRequest<T[]>(endpoint);
  }

  async getById<T = any>(resource: string, id: string | number): Promise<ApiResponse<T>> {
    return await this.apiRequest<T>(\`/\${resource}/\${id}\`);
  }

  async update<T = any>(resource: string, id: string | number, data: Partial<T>): Promise<ApiResponse<T>> {
    return await this.apiRequest<T>(\`/\${resource}/\${id}\`, { method: 'PUT', data });
  }

  async delete(resource: string, id: string | number): Promise<ApiResponse> {
    return await this.apiRequest(\`/\${resource}/\${id}\`, { method: 'DELETE' });
  }
}

export const apiService = new ApiService();`,

    'auth.service.ts': `// src/services/auth.service.ts
import { apiService } from './api.service';
import { LoginCredentials, AuthResponse } from '../types/auth.types';
import { ApiResponse } from '../types/common.types';

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await apiService.apiRequest<AuthResponse>('/authentication/users/login', {
      method: 'POST',
      data: credentials,
    });

    if (response.success && response.data?.token) {
      await apiService.setAuthToken(response.data.token);
    }

    return response;
  }

  static async logout(): Promise<ApiResponse> {
    const response = await apiService.apiRequest('/authentication/logout', {
      method: 'POST',
    });
    
    await apiService.removeAuthToken();
    return response;
  }

  static async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    const response = await apiService.apiRequest<{ token: string }>('/authentication/refresh', {
      method: 'POST',
    });

    if (response.success && response.data?.token) {
      await apiService.setAuthToken(response.data.token);
    }

    return response;
  }
}`,

    'user.service.ts': `// src/services/user.service.ts
import { apiService } from './api.service';
import { User } from '../types/user.types';
import { ApiResponse, SearchParams } from '../types/common.types';

export class UserService {
  private static readonly RESOURCE = 'users';

  static async getAllUsers(params?: SearchParams): Promise<ApiResponse<User[]>> {
    return await apiService.getAll<User>(this.RESOURCE, params);
  }

  static async getUserById(id: string | number): Promise<ApiResponse<User>> {
    return await apiService.getById<User>(this.RESOURCE, id);
  }

  static async createUser(userData: Partial<User>): Promise<ApiResponse<User>> {
    return await apiService.create<User>(this.RESOURCE, userData);
  }

  static async updateUser(id: string | number, userData: Partial<User>): Promise<ApiResponse<User>> {
    return await apiService.update<User>(this.RESOURCE, id, userData);
  }

  static async deleteUser(id: string | number): Promise<ApiResponse> {
    return await apiService.delete(this.RESOURCE, id);
  }

  static async searchUsers(query: string, filters?: SearchParams): Promise<ApiResponse<User[]>> {
    return await apiService.getAll<User>(this.RESOURCE, {
      q: query,
      ...filters,
    });
  }
}`,

    'workcode.service.ts': `// src/services/workcode.service.ts
import { apiService } from './api.service';
import { WorkCode } from '../types/workcode.types';
import { ApiResponse } from '../types/common.types';

export class WorkCodeService {
  private static readonly RESOURCE = 'work-codes';

  static async getAllWorkCodes(): Promise<ApiResponse<WorkCode[]>> {
    return await apiService.getAll<WorkCode>(this.RESOURCE);
  }

  static async getWorkCodeById(id: number): Promise<ApiResponse<WorkCode>> {
    return await apiService.getById<WorkCode>(this.RESOURCE, id);
  }

  static async createWorkCode(data: Omit<WorkCode, 'work_code_id'>): Promise<ApiResponse<WorkCode>> {
    return await apiService.create<WorkCode>(\`\${this.RESOURCE}/create\`, data);
  }

  static async updateWorkCode(id: number, data: Omit<WorkCode, 'work_code_id'>): Promise<ApiResponse<WorkCode>> {
    return await apiService.update<WorkCode>(this.RESOURCE, id, data);
  }

  static async deleteWorkCode(id: number): Promise<ApiResponse> {
    return await apiService.delete(this.RESOURCE, id);
  }

  static getStatusLabel(status: number): string {
    const labels: Record<number, string> = { 
      0: 'Inactive', 
      1: 'Active', 
      2: 'Pending', 
      3: 'Archived' 
    };
    return labels[status] || 'Unknown';
  }

  static getStatusColor(status: number): string {
    const colors: Record<number, string> = {
      0: 'bg-gray-100 text-gray-700',
      1: 'bg-green-100 text-green-700',
      2: 'bg-yellow-100 text-yellow-700',
      3: 'bg-blue-100 text-blue-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  }
}`,

    'styles.classes.ts': `// src/styles/styles.classes.ts
// Centralized class name definitions for consistent styling across the application

export const commonClasses = {
  // Layout
  container: 'min-h-screen flex items-center justify-center p-4',
  card: 'rounded-lg shadow-xl p-8 max-w-md w-full',
  pageContainer: 'p-4 sm:p-6',
  
  // Header
  headerContainer: 'text-center mb-8',
  iconWrapper: 'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
  title: 'text-3xl font-bold mb-2',
  subtitle: 'text-base',
  pageTitle: 'text-xl sm:text-2xl font-bold mb-4',
  
  // Alerts
  alertContainer: 'mb-6 border rounded-lg p-4 flex items-start',
  alertIcon: 'w-5 h-5 mr-3 flex-shrink-0 mt-0.5',
  alertText: 'text-sm',
  
  // Form
  formContainer: 'space-y-5',
  fieldContainer: '',
  label: 'block text-sm font-medium mb-2',
  inputWrapper: 'relative',
  inputIcon: 'absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none',
  inputIconSize: 'h-5 w-5',
  input: 'w-full pl-10 pr-4 py-3 border rounded-lg outline-none transition-all',
  inputWithButton: 'w-full pl-10 pr-12 py-3 border rounded-lg outline-none transition-all',
  inputButton: 'absolute inset-y-0 right-0 pr-3 flex items-center',
  inputField: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
  errorText: 'mt-1 text-sm',
  
  // Checkbox and options
  optionsContainer: 'flex items-center justify-between',
  checkboxLabel: 'flex items-center cursor-pointer',
  checkbox: 'w-5 h-5 border rounded flex items-center justify-center',
  checkboxIcon: 'w-4 h-4',
  checkboxText: 'ml-2 text-sm',
  forgotPasswordButton: 'text-sm font-medium',
  
  // Buttons
  submitButton: 'w-full py-3 px-4 rounded-lg transition-all font-medium flex items-center justify-center',
  logoutButton: 'w-full py-3 px-4 rounded-lg transition-colors font-medium',
  primaryButton: 'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
  secondaryButton: 'px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors',
  dangerButton: 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors',
  iconButton: 'p-2 hover:bg-gray-100 rounded transition-colors',
  
  // Footer
  footer: 'mt-6 text-center text-sm',
  footerButton: 'font-medium',
  
  // Success screen
  successIconWrapper: 'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
  successIcon: 'w-8 h-8',
  successTitle: 'text-2xl font-bold mb-2',
  successText: 'mb-6',
  
  // Demo credentials
  demoContainer: 'mb-6 border rounded-lg p-4',
  demoTitle: 'text-sm font-medium mb-1',
  demoText: 'text-xs',
  
  // Loading spinner
  spinner: 'animate-spin -ml-1 mr-3 h-5 w-5',
  spinnerCircle: 'opacity-25',
  spinnerPath: 'opacity-75',
  
  // Tables
  tableContainer: 'bg-white rounded-lg shadow overflow-hidden',
  tableHeader: 'bg-gray-100',
  tableHeaderCell: 'px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase',
  tableRow: 'hover:bg-gray-50',
  tableCell: 'px-4 lg:px-6 py-4',
  
  // Cards
  cardContainer: 'bg-white p-4 rounded-lg shadow border border-gray-200',
  cardTitle: 'font-semibold',
  cardText: 'text-sm text-gray-600',
  
  // Grid
  gridContainer: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4',
  
  // Status Badges
  statusBadge: 'px-2 py-1 text-xs font-medium rounded-full',
  
  // Navigation
  navButton: 'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
  navButtonActive: 'bg-indigo-600',
  navButtonInactive: 'hover:bg-gray-800',
  
  // Modals/Dialogs
  dialogOverlay: 'fixed inset-0 bg-black/50 z-40',
  dialogContent: 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto z-50',
  dialogTitle: 'text-xl font-bold text-gray-900 mb-4',
  dialogDescription: 'text-sm text-gray-600 mb-6',
  
  // Filters
  filterContainer: 'display: grid, gridTemplateColumns: repeat(6, 1fr), gap: var(--spacing-md), padding: var(--spacing-md), backgroundColor: var(--color-background), borderRadius: var(--radius-lg), marginBottom: var(--spacing-md), boxShadow: var(--shadow-sm)',
  
  // Sidebar
  sidebar: 'hidden lg:flex lg:w-64 bg-gray-900 text-white flex-col',
  sidebarHeader: 'p-4 border-b border-gray-800',
  sidebarNav: 'flex-1 px-2 py-4',
  sidebarFooter: 'p-4 border-t border-gray-800',
  
  // Mobile menu
  mobileMenuButton: 'lg:hidden p-2 hover:bg-gray-100 rounded transition-colors',
  
  // Shared state indicators
  sharedStateIndicator: 'mb-4 p-3 sm:p-4 border rounded-lg',
  sharedStateIcon: 'w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0',
  sharedStateText: 'text-xs sm:text-sm',
};

export const themeClasses = {
  // These will use CSS variables for dynamic theming
  primary: 'bg-[var(--color-primary)] text-white',
  primaryHover: 'hover:bg-[var(--color-primary-hover)]',
  primaryLight: 'bg-[var(--color-primary-light)]',
  
  surface: 'bg-[var(--color-surface)]',
  background: 'bg-[var(--color-background)]',
  
  textPrimary: 'text-[var(--color-text)]',
  textSecondary: 'text-[var(--color-text-secondary)]',
  textMuted: 'text-[var(--color-text-muted)]',
  
  border: 'border-[var(--color-border)]',
  borderFocus: 'focus:border-[var(--color-border-focus)]',
  
  success: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
  error: 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]',
};

// Utility function to combine classes
export const combineClasses = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};`
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#ffffff',
      padding: '32px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#1e293b',
            marginBottom: '8px'
          }}>
            Organized Project Structure
          </h1>
          <p style={{ color: '#64748b', fontSize: '16px' }}>
            Complete file organization with theme support and centralized API services
          </p>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '24px',
          borderBottom: '2px solid #e2e8f0'
        }}>
          <button
            onClick={() => setSelectedTab('structure')}
            style={{
              padding: '12px 24px',
              backgroundColor: selectedTab === 'structure' ? '#3b82f6' : 'transparent',
              color: selectedTab === 'structure' ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            Project Structure
          </button>
          <button
            onClick={() => setSelectedTab('files')}
            style={{
              padding: '12px 24px',
              backgroundColor: selectedTab === 'files' ? '#3b82f6' : 'transparent',
              color: selectedTab === 'files' ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            File Contents
          </button>
        </div>

        {selectedTab === 'structure' ? (
          <div style={{ 
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <FileTree node={projectStructure} />
          </div>
        ) : (
          <div style={{ 
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              marginBottom: '24px',
              color: '#1e293b'
            }}>
              Key File Contents
            </h2>
            
            <FileContent filename="src/types/common.types.ts" content={files['common.types.ts']} />
            <FileContent filename="src/types/user.types.ts" content={files['user.types.ts']} />
            <FileContent filename="src/types/workcode.types.ts" content={files['workcode.types.ts']} />
            <FileContent filename="src/types/auth.types.ts" content={files['auth.types.ts']} />
            <FileContent filename="src/services/api.service.ts" content={files['api.service.ts']} />
            <FileContent filename="src/services/auth.service.ts" content={files['auth.service.ts']} />
            <FileContent filename="src/services/user.service.ts" content={files['user.service.ts']} />
            <FileContent filename="src/services/workcode.service.ts" content={files['workcode.service.ts']} />
          </div>
        )}

        <div style={{
          marginTop: '32px',
          padding: '24px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            marginBottom: '16px',
            color: '#0c4a6e'
          }}>
            Key Improvements
          </h3>
          <ul style={{ 
            color: '#0369a1',
            fontSize: '14px',
            lineHeight: '1.8',
            paddingLeft: '20px'
          }}>
            <li><strong>Separated Types:</strong> All interfaces organized in dedicated type files</li>
            <li><strong>Service Layer:</strong> Centralized API calls in service classes</li>
            <li><strong>Theme Integration:</strong> All components use CSS variables for theming</li>
            <li><strong>Configuration Management:</strong> Dedicated config files for each module</li>
            <li><strong>Single Responsibility:</strong> Each file has one clear purpose</li>
            <li><strong>Type Safety:</strong> Full TypeScript support throughout</li>
            <li><strong>Reusability:</strong> Common components and utilities shared across modules</li>
          </ul>
        </div>
      </div>
    </div>
  );
}