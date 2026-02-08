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
} from './common.services.ts';

// ============================================================================
// User Types
// ============================================================================

export interface User {
  userId?: number;
  userName: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  userStatus?: number;
  email?: string;
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
// Profile Settings Types
// ============================================================================

export interface UserProfileSetting {
  profileSettingId?: number;
  userId: number;
  settingKey: string;
  settingValue: string;
}

// ============================================================================
// User Group Types (administrationservice)
// ============================================================================

export interface UserGroupDTO {
  groupId?: number;
  groupName: string;
  description?: string;
  parentGroupId?: number;
  parentGroupName?: string;
  createdAt?: string;
}

export interface UserGroupMembershipDTO {
  membershipId?: number;
  userId: number;
  username?: string;
  groupId: number;
  groupName?: string;
}

// ============================================================================
// Subject Attribute Types (administrationservice)
// ============================================================================

export interface SubjectAttributeDTO {
  subjectAttrId?: number;
  attributeId: number;
  attributeName?: string;
  attributeValue: string;
  validFrom?: string;
  validUntil?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserSubjectAttributeDTO {
  id?: number;
  userId: number;
  username?: string;
  subjectAttrId: number;
  attributeName?: string;
  attributeValue?: string;
  createdAt?: string;
}

// ============================================================================
// Organization Types (userservice/employeeservice)
// ============================================================================

export interface OrganizationDTO {
  organizationId?: number;
  parentOrganizationId?: number;
  organization: string;
  description?: string;
  status?: number;
}

// ============================================================================
// Backend Response Wrapper
// ============================================================================

export interface CustomResponse<T> {
  time?: string;
  httpStatus?: string;
  isSuccess: boolean;
  response: T;
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
   * Get all users
   */
  async getAllUsers(): Promise<ApiResponse<CustomResponse<User[]>>> {
    return this.client.get<CustomResponse<User[]>>('/users');
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: number): Promise<ApiResponse<CustomResponse<User>>> {
    return this.client.get<CustomResponse<User>>(`/users/${userId}`);
  }

  /**
   * Update user by ID
   */
  async updateUser(userId: number, data: Partial<User>): Promise<ApiResponse<CustomResponse<User>>> {
    return this.client.put<CustomResponse<User>>(`/users/${userId}`, data);
  }

  /**
   * Delete user by ID
   */
  async deleteUser(userId: number): Promise<ApiResponse<CustomResponse<void>>> {
    return this.client.delete<CustomResponse<void>>(`/users/${userId}`);
  }

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
  async activateUser(userId: number): Promise<ApiResponse<User>> {
    return this.client.post<User>(`/users/${userId}/activate`);
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(userId: number): Promise<ApiResponse<User>> {
    return this.client.post<User>(`/users/${userId}/deactivate`);
  }

  /**
   * Search users by query
   */
  async searchUsers(query: string, filters?: SearchParams): Promise<ApiResponse<User[]>> {
    return this.search(query, filters);
  }

  // =========================================================================
  // Profile Settings Methods
  // =========================================================================

  /**
   * Get all profile settings for a user
   */
  async getProfileSettings(userId: number): Promise<ApiResponse<CustomResponse<UserProfileSetting[]>>> {
    return this.client.get<CustomResponse<UserProfileSetting[]>>(`/users/${userId}/profile-settings`);
  }

  /**
   * Save (create or update) a profile setting for a user
   */
  async saveProfileSetting(userId: number, setting: UserProfileSetting): Promise<ApiResponse<CustomResponse<UserProfileSetting>>> {
    return this.client.post<CustomResponse<UserProfileSetting>>(`/users/${userId}/profile-settings`, setting);
  }

  /**
   * Delete a profile setting
   */
  async deleteProfileSetting(userId: number, settingId: number): Promise<ApiResponse<CustomResponse<void>>> {
    return this.client.delete<CustomResponse<void>>(`/users/${userId}/profile-settings/${settingId}`);
  }

  // =========================================================================
  // User Group Methods (via administrationservice gateway)
  // =========================================================================

  /**
   * Get all user groups
   */
  async getAllGroups(): Promise<ApiResponse<UserGroupDTO[]>> {
    return this.client.get<UserGroupDTO[]>('/user-groups');
  }

  /**
   * Get all groups a user belongs to
   */
  async getGroupsForUser(userId: number): Promise<ApiResponse<UserGroupMembershipDTO[]>> {
    return this.client.get<UserGroupMembershipDTO[]>(`/user-groups/user/${userId}`);
  }

  /**
   * Add a user to a group
   */
  async addUserToGroup(dto: UserGroupMembershipDTO): Promise<ApiResponse<UserGroupMembershipDTO>> {
    return this.client.post<UserGroupMembershipDTO>('/user-groups/members', dto);
  }

  /**
   * Remove a user from a group
   */
  async removeUserFromGroup(membershipId: number): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/user-groups/members/${membershipId}`);
  }

  // =========================================================================
  // Subject Attribute Methods (via administrationservice gateway)
  // =========================================================================

  /**
   * Get all subject attributes
   */
  async getAllSubjectAttributes(): Promise<ApiResponse<SubjectAttributeDTO[]>> {
    return this.client.get<SubjectAttributeDTO[]>('/subject-attributes');
  }

  /**
   * Get subject attributes by attribute definition name (e.g., 'role')
   */
  async getSubjectAttributesByAttributeName(attributeName: string): Promise<ApiResponse<SubjectAttributeDTO[]>> {
    return this.client.get<SubjectAttributeDTO[]>(`/subject-attributes/by-attribute-name/${attributeName}`);
  }

  /**
   * Get all resolved attributes for a user (direct + group assignments)
   */
  async getResolvedAttributesForUser(userId: number): Promise<ApiResponse<SubjectAttributeDTO[]>> {
    return this.client.get<SubjectAttributeDTO[]>(`/subject-attributes/user/${userId}/resolved`);
  }

  /**
   * Assign a subject attribute directly to a user
   */
  async assignAttributeToUser(dto: UserSubjectAttributeDTO): Promise<ApiResponse<UserSubjectAttributeDTO>> {
    return this.client.post<UserSubjectAttributeDTO>('/subject-attributes/assign/user', dto);
  }

  /**
   * Remove a direct attribute assignment from a user
   */
  async removeAttributeFromUser(userId: number, subjectAttrId: number): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/subject-attributes/assign/user/${userId}/${subjectAttrId}`);
  }

  // =========================================================================
  // Organization Methods (via userservice gateway)
  // =========================================================================

  /**
   * Get all organizations
   */
  async getAllOrganizations(): Promise<ApiResponse<OrganizationDTO[]>> {
    return this.client.get<OrganizationDTO[]>('/organization');
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
