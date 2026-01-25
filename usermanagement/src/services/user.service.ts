/**
 * User Service
 * User-specific operations built on top of CommonService
 * Follows Open/Closed Principle - extends CommonService without modifying it
 */

import {
  HttpClient,
  CommonService,
  ApiResponse,
  SearchParams,
} from './commonServices';

// ============================================================================
// User Types
// ============================================================================

export interface User {
  userId?: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  metadata?: Record<string, any>;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
  expiresIn?: number;
}

// ============================================================================
// User Service Class
// ============================================================================

export class UserService extends CommonService<User> {
  constructor(client: HttpClient) {
    super(client, 'users');
  }

  // =========================================================================
  // Authentication Methods
  // =========================================================================

  /**
   * Login user and store authentication token
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await this.client.post<AuthResponse>(
      '/users/login',
      credentials,
      { skipAuth: true }
    );

    // Store token on successful login
    if (response.success && response.data?.token) {
      await this.client.setAuthToken(response.data.token);
    }

    return response;
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    const response = await this.client.post<AuthResponse>(
      '/users/register',
      data,
      { skipAuth: true }
    );

    // Store token on successful registration
    if (response.success && response.data?.token) {
      await this.client.setAuthToken(response.data.token);
    }

    return response;
  }

  /**
   * Logout user and clear authentication
   */
  async logout(): Promise<ApiResponse<void>> {
    const response = await this.client.post<void>('/users/logout');

    // Clear token regardless of response
    await this.client.removeAuthToken();

    return response;
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthResponse>> {
    const response = await this.client.post<AuthResponse>(
      '/users/refresh-token',
      { refreshToken }
    );

    if (response.success && response.data?.token) {
      await this.client.setAuthToken(response.data.token);
    }

    return response;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<void>> {
    return this.client.post<void>(
      '/users/request-password-reset',
      { email },
      { skipAuth: true }
    );
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordData): Promise<ApiResponse<void>> {
    return this.client.post<void>(
      '/users/reset-password',
      data,
      { skipAuth: true }
    );
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(data: ChangePasswordData): Promise<ApiResponse<void>> {
    return this.client.post<void>('/users/change-password', data);
  }

  // =========================================================================
  // Profile Methods
  // =========================================================================

  /**
   * Get current user's profile
   */
  async getProfile(): Promise<ApiResponse<User>> {
    return this.client.get<User>('/users/me');
  }

  /**
   * Update current user's profile
   */
  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.client.patch<User>('/users/me', data);
  }

  /**
   * Delete current user's account
   */
  async deleteAccount(): Promise<ApiResponse<void>> {
    const response = await this.client.delete<void>('/users/me');
    
    if (response.success) {
      await this.client.removeAuthToken();
    }

    return response;
  }

  // =========================================================================
  // User Management Methods (Admin)
  // =========================================================================

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<ApiResponse<User>> {
    return this.client.get<User>(`/users/username/${username}`);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<ApiResponse<User>> {
    return this.client.get<User>(`/users/email/${email}`);
  }

  /**
   * Get all active users
   */
  async getActiveUsers(params?: SearchParams): Promise<ApiResponse<User[]>> {
    return this.client.get<User[]>('/users/active', params);
  }

  /**
   * Get all inactive users
   */
  async getInactiveUsers(params?: SearchParams): Promise<ApiResponse<User[]>> {
    return this.client.get<User[]>('/users/inactive', params);
  }

  /**
   * Activate user account
   */
  async activateUser(userId: string): Promise<ApiResponse<User>> {
    return this.client.post<User>(`/users/${userId}/activate`);
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(userId: string): Promise<ApiResponse<User>> {
    return this.client.post<User>(`/users/${userId}/deactivate`);
  }

  /**
   * Search users by query
   */
  async searchUsers(query: string, filters?: SearchParams): Promise<ApiResponse<User[]>> {
    return this.search(query, filters);
  }

  // =========================================================================
  // Validation Methods (Client-side validation)
  // =========================================================================

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   * Returns array of validation errors, empty if valid
   */
  static validatePassword(password: string): string[] {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return errors;
  }

  /**
   * Validate username format
   */
  static validateUsername(username: string): boolean {
    // Username must be 3-30 characters, alphanumeric with underscores and hyphens
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    return usernameRegex.test(username);
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export const createUserService = (client: HttpClient): UserService => {
  return new UserService(client);
};
