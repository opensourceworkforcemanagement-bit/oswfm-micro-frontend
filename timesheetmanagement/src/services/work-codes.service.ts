/**
 * Work Code Service
 * Service for managing work codes
 * Built on top of CommonService following SOLID principles
 */

import {
  HttpClient,
  CommonService,
  BatchService,
  ApiResponse,
  SearchParams,
} from './common.services';

// ============================================================================
// Work Code Types
// ============================================================================

export interface WorkCode {
  work_code_id: number;
  code: string;
  description?: string;
  category?: string;
  status: WorkCodeStatus;
  isActive?: boolean;
  effectiveDate?: string;
  expirationDate?: string;
  costCenter?: string;
  department?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export type WorkCodeStatus = 0 | 1 | 2 | 3; // Inactive, Active, Pending, Archived

export interface CreateWorkCodeRequest {
  code: string;
  description?: string;
  category?: string;
  status?: WorkCodeStatus;
  effectiveDate?: string;
  expirationDate?: string;
  costCenter?: string;
  department?: string;
  metadata?: Record<string, any>;
}

export interface UpdateWorkCodeRequest {
  code?: string;
  description?: string;
  category?: string;
  status?: WorkCodeStatus;
  effectiveDate?: string;
  expirationDate?: string;
  costCenter?: string;
  department?: string;
  metadata?: Record<string, any>;
}

export interface WorkCodeSearchFilters extends SearchParams {
  status?: WorkCodeStatus;
  category?: string;
  department?: string;
  costCenter?: string;
  effectiveDate?: string;
  isActive?: boolean;
}

// ============================================================================
// Work Code Service Class
// ============================================================================

export class WorkCodeService extends CommonService<WorkCode> {
  constructor(client: HttpClient) {
    super(client, 'work-codes');
  }

  // =========================================================================
  // CRUD Operations (inherited from CommonService)
  // =========================================================================
  // - getAll(params?: SearchParams): Promise<ApiResponse<WorkCode[]>>
  // - getById(id: string | number): Promise<ApiResponse<WorkCode>>
  // - create(data: Partial<WorkCode>): Promise<ApiResponse<WorkCode>>
  // - update(id: string | number, data: Partial<WorkCode>): Promise<ApiResponse<WorkCode>>
  // - partialUpdate(id: string | number, data: Partial<WorkCode>): Promise<ApiResponse<WorkCode>>
  // - delete(id: string | number): Promise<ApiResponse<void>>
  // - search(query: string, filters?: SearchParams): Promise<ApiResponse<WorkCode[]>>
  // - getPaginated(...): Promise<ApiResponse<...>>

  // =========================================================================
  // Specialized Work Code Methods
  // =========================================================================

  /**
   * Get all work codes with optional filters
   */
  async getAllWorkCodes(filters?: WorkCodeSearchFilters): Promise<ApiResponse<WorkCode[]>> {
    return this.getAll(filters);
  }

  /**
   * Get work code by ID
   */
  async getWorkCodeById(id: number): Promise<ApiResponse<WorkCode>> {
    return this.getById(id);
  }

  /**
   * Create a new work code
   */
  async createWorkCode(data: CreateWorkCodeRequest): Promise<ApiResponse<WorkCode>> {
    // Validate work code data before creating
    const validationError = WorkCodeService.validateWorkCode(data);
    if (validationError) {
      return {
        success: false,
        error: 'ValidationError',
        message: validationError,
        data: null,
      };
    }

    return this.create(data, 'create');
  }

  /**
   * Update an existing work code
   */
  async updateWorkCode(
    id: number,
    data: UpdateWorkCodeRequest
  ): Promise<ApiResponse<WorkCode>> {
    // Use partial update for flexibility
    return this.partialUpdate(id, data);
  }

  /**
   * Delete a work code
   */
  async deleteWorkCode(id: number): Promise<ApiResponse<void>> {
    return this.delete(id);
  }

  /**
   * Get work codes by status
   */
  async getWorkCodesByStatus(status: WorkCodeStatus): Promise<ApiResponse<WorkCode[]>> {
    return this.getAll({ status });
  }

  /**
   * Get work codes by category
   */
  async getWorkCodesByCategory(category: string): Promise<ApiResponse<WorkCode[]>> {
    return this.getAll({ category });
  }

  /**
   * Get work codes by department
   */
  async getWorkCodesByDepartment(department: string): Promise<ApiResponse<WorkCode[]>> {
    return this.getAll({ department });
  }

  /**
   * Get active work codes only
   */
  async getActiveWorkCodes(): Promise<ApiResponse<WorkCode[]>> {
    return this.getAll({ status: 1 });
  }

  /**
   * Get inactive work codes only
   */
  async getInactiveWorkCodes(): Promise<ApiResponse<WorkCode[]>> {
    return this.getAll({ status: 0 });
  }

  /**
   * Search work codes by code or description
   */
  async searchWorkCodes(
    query: string,
    filters?: WorkCodeSearchFilters
  ): Promise<ApiResponse<WorkCode[]>> {
    return this.search(query, filters);
  }

  /**
   * Activate a work code
   */
  async activateWorkCode(id: number): Promise<ApiResponse<WorkCode>> {
    return this.partialUpdate(id, { status: 1 });
  }

  /**
   * Deactivate a work code
   */
  async deactivateWorkCode(id: number): Promise<ApiResponse<WorkCode>> {
    return this.partialUpdate(id, { status: 0 });
  }

  /**
   * Archive a work code
   */
  async archiveWorkCode(id: number): Promise<ApiResponse<WorkCode>> {
    return this.partialUpdate(id, { status: 3 });
  }

  /**
   * Get work codes expiring soon (within specified days)
   */
  async getExpiringWorkCodes(days: number = 30): Promise<ApiResponse<WorkCode[]>> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return this.getAll({
      expirationDate: futureDate.toISOString().split('T')[0],
    });
  }

  /**
   * Bulk update work code status
   */
  async bulkUpdateStatus(
    ids: number[],
    status: WorkCodeStatus
  ): Promise<ApiResponse<WorkCode[]>> {
    const updates = ids.map(id => ({
      id,
      data: { status },
    }));

    // Use batch service if available, otherwise do sequential updates
    return this.client.put(`/${this.resourcePath}/batch`, { updates });
  }

  // =========================================================================
  // Static Utility Methods
  // =========================================================================

  /**
   * Get human-readable status label
   */
  static getStatusLabel(status: WorkCodeStatus): string {
    const labels: Record<WorkCodeStatus, string> = {
      0: 'Inactive',
      1: 'Active',
      2: 'Pending',
      3: 'Archived',
    };
    return labels[status] || 'Unknown';
  }

  /**
   * Get status color class (for UI)
   * Note: Returns class names, not inline styles
   */
  static getStatusColor(status: WorkCodeStatus): string {
    const colors: Record<WorkCodeStatus, string> = {
      0: 'status-inactive',
      1: 'status-active',
      2: 'status-pending',
      3: 'status-archived',
    };
    return colors[status] || 'status-unknown';
  }

  /**
   * Get all available status options
   */
  static getStatusOptions(): Array<{ value: WorkCodeStatus; label: string }> {
    return [
      { value: 0, label: 'Inactive' },
      { value: 1, label: 'Active' },
      { value: 2, label: 'Pending' },
      { value: 3, label: 'Archived' },
    ];
  }

  /**
   * Validate work code data
   */
  static validateWorkCode(data: CreateWorkCodeRequest | UpdateWorkCodeRequest): string | null {
    // Validate code format
    if ('code' in data && data.code) {
      if (data.code.length < 2) {
        return 'Work code must be at least 2 characters long';
      }
      if (data.code.length > 50) {
        return 'Work code must not exceed 50 characters';
      }
      // Check for valid characters (alphanumeric, hyphens, underscores)
      if (!/^[A-Za-z0-9_-]+$/.test(data.code)) {
        return 'Work code can only contain letters, numbers, hyphens, and underscores';
      }
    }

    // Validate dates if provided
    if ('effectiveDate' in data && 'expirationDate' in data) {
      if (data.effectiveDate && data.expirationDate) {
        const effective = new Date(data.effectiveDate);
        const expiration = new Date(data.expirationDate);
        
        if (expiration <= effective) {
          return 'Expiration date must be after effective date';
        }
      }
    }

    // Validate status
    if ('status' in data && data.status !== undefined) {
      if (![0, 1, 2, 3].includes(data.status)) {
        return 'Invalid status value. Must be 0 (Inactive), 1 (Active), 2 (Pending), or 3 (Archived)';
      }
    }

    return null;
  }

  /**
   * Check if work code is currently effective
   */
  static isEffective(workCode: WorkCode): boolean {
    const now = new Date();
    
    if (workCode.effectiveDate) {
      const effective = new Date(workCode.effectiveDate);
      if (effective > now) return false;
    }
    
    if (workCode.expirationDate) {
      const expiration = new Date(workCode.expirationDate);
      if (expiration < now) return false;
    }
    
    return workCode.status === 1; // Must be active
  }

  /**
   * Check if work code is expiring soon
   */
  static isExpiringSoon(workCode: WorkCode, days: number = 30): boolean {
    if (!workCode.expirationDate) return false;
    
    const now = new Date();
    const expiration = new Date(workCode.expirationDate);
    const daysUntilExpiration = Math.ceil(
      (expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysUntilExpiration > 0 && daysUntilExpiration <= days;
  }

  /**
   * Format work code for display
   */
  static formatWorkCode(workCode: WorkCode): string {
    const parts: string[] = [workCode.code];
    
    if (workCode.description) {
      parts.push(workCode.description);
    }
    
    if (workCode.department) {
      parts.push(`[${workCode.department}]`);
    }
    
    return parts.join(' - ');
  }

  /**
   * Parse work code from formatted string
   */
  static parseWorkCode(formatted: string): Partial<WorkCode> {
    const parts = formatted.split(' - ');
    const result: Partial<WorkCode> = {
      code: parts[0]?.trim(),
    };
    
    if (parts[1]) {
      result.description = parts[1].trim();
    }
    
    // Extract department from brackets
    const deptMatch = formatted.match(/\[([^\]]+)\]/);
    if (deptMatch) {
      result.department = deptMatch[1];
    }
    
    return result;
  }

  /**
   * Group work codes by category
   */
  static groupByCategory(workCodes: WorkCode[]): Record<string, WorkCode[]> {
    return workCodes.reduce((acc, workCode) => {
      const category = workCode.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(workCode);
      return acc;
    }, {} as Record<string, WorkCode[]>);
  }

  /**
   * Group work codes by department
   */
  static groupByDepartment(workCodes: WorkCode[]): Record<string, WorkCode[]> {
    return workCodes.reduce((acc, workCode) => {
      const department = workCode.department || 'Unassigned';
      if (!acc[department]) {
        acc[department] = [];
      }
      acc[department].push(workCode);
      return acc;
    }, {} as Record<string, WorkCode[]>);
  }

  /**
   * Sort work codes by code
   */
  static sortByCode(workCodes: WorkCode[], ascending: boolean = true): WorkCode[] {
    return [...workCodes].sort((a, b) => {
      const comparison = a.code.localeCompare(b.code);
      return ascending ? comparison : -comparison;
    });
  }

  /**
   * Sort work codes by status
   */
  static sortByStatus(workCodes: WorkCode[], ascending: boolean = true): WorkCode[] {
    return [...workCodes].sort((a, b) => {
      const comparison = a.status - b.status;
      return ascending ? comparison : -comparison;
    });
  }

  /**
   * Filter work codes by status
   */
  static filterByStatus(workCodes: WorkCode[], status: WorkCodeStatus): WorkCode[] {
    return workCodes.filter(wc => wc.status === status);
  }

  /**
   * Filter active work codes
   */
  static filterActive(workCodes: WorkCode[]): WorkCode[] {
    return workCodes.filter(wc => wc.status === 1);
  }

  /**
   * Filter effective work codes
   */
  static filterEffective(workCodes: WorkCode[]): WorkCode[] {
    return workCodes.filter(wc => WorkCodeService.isEffective(wc));
  }
}

// ============================================================================
// Batch Work Code Service
// ============================================================================

export class WorkCodeBatchService extends BatchService<WorkCode> {
  constructor(client: HttpClient) {
    super(client, 'work-codes');
  }

  /**
   * Batch create work codes
   */
  async batchCreateWorkCodes(
    workCodes: CreateWorkCodeRequest[]
  ): Promise<ApiResponse<WorkCode[]>> {
    // Validate all work codes before creating
    for (const workCode of workCodes) {
      const validationError = WorkCodeService.validateWorkCode(workCode);
      if (validationError) {
        return {
          success: false,
          error: 'ValidationError',
          message: `Invalid work code "${workCode.code}": ${validationError}`,
          data: null,
        };
      }
    }

    return this.batchCreate(workCodes);
  }

  /**
   * Batch update work codes
   */
  async batchUpdateWorkCodes(
    updates: Array<{ id: number; data: UpdateWorkCodeRequest }>
  ): Promise<ApiResponse<WorkCode[]>> {
    return this.batchUpdate(updates);
  }

  /**
   * Batch delete work codes
   */
  async batchDeleteWorkCodes(ids: number[]): Promise<ApiResponse<void>> {
    return this.batchDelete(ids);
  }

  /**
   * Batch activate work codes
   */
  async batchActivateWorkCodes(ids: number[]): Promise<ApiResponse<WorkCode[]>> {
    const updates = ids.map(id => ({
      id,
      data: { status: 1 as WorkCodeStatus },
    }));
    return this.batchUpdate(updates);
  }

  /**
   * Batch deactivate work codes
   */
  async batchDeactivateWorkCodes(ids: number[]): Promise<ApiResponse<WorkCode[]>> {
    const updates = ids.map(id => ({
      id,
      data: { status: 0 as WorkCodeStatus },
    }));
    return this.batchUpdate(updates);
  }

  /**
   * Batch archive work codes
   */
  async batchArchiveWorkCodes(ids: number[]): Promise<ApiResponse<WorkCode[]>> {
    const updates = ids.map(id => ({
      id,
      data: { status: 3 as WorkCodeStatus },
    }));
    return this.batchUpdate(updates);
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export const createWorkCodeService = (client: HttpClient): WorkCodeService => {
  return new WorkCodeService(client);
};

export const createWorkCodeBatchService = (client: HttpClient): WorkCodeBatchService => {
  return new WorkCodeBatchService(client);
};

// ============================================================================
// Export for backward compatibility
// ============================================================================

export default WorkCodeService;
