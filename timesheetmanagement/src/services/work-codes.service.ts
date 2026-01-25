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

import { WorkforceCode, CodeType, WorkforceCodeStatus } from '../types/workcode.types';

export interface CreateWorkforceCodeRequest {
  prefix: string;
  suffix: string;
  shortWorkforceCode: string;
  longWorkforceCode: string;
  description?: string;
  status?: WorkforceCodeStatus;
  effectiveDate?: Date;
  expirationDate?: Date;
  codeType: CodeType;
}

export interface UpdateWorkforceCodeRequest {
  prefix?: string;
  suffix?: string;
  shortWorkforceCode?: string;
  longWorkforceCode?: string;
  description?: string;
  status?: WorkforceCodeStatus;
  effectiveDate?: Date;
  expirationDate?: Date;
  codeType?: CodeType;
}

export interface WorkforceCodeSearchFilters extends SearchParams {
  status?: WorkforceCodeStatus;
  codeType?: CodeType;
  effectiveDate?: string;
  isActive?: boolean;
}

// ============================================================================
// Work Code Service Class
// ============================================================================

export class WorkCodeService extends CommonService<WorkforceCode> {
  constructor(client: HttpClient) {
    super(client, 'work-codes');
  }

  // =========================================================================
  // CRUD Operations (inherited from CommonService)
  // =========================================================================
  // - getAll(params?: SearchParams): Promise<ApiResponse<WorkforceCode[]>>
  // - getById(id: string | number): Promise<ApiResponse<WorkforceCode>>
  // - create(data: Partial<WorkforceCode>): Promise<ApiResponse<WorkforceCode>>
  // - update(id: string | number, data: Partial<WorkforceCode>): Promise<ApiResponse<WorkforceCode>>
  // - partialUpdate(id: string | number, data: Partial<WorkforceCode>): Promise<ApiResponse<WorkforceCode>>
  // - delete(id: string | number): Promise<ApiResponse<void>>
  // - search(query: string, filters?: SearchParams): Promise<ApiResponse<WorkforceCode[]>>
  // - getPaginated(...): Promise<ApiResponse<...>>

  // =========================================================================
  // Specialized Work Code Methods
  // =========================================================================

  /**
   * Get all work codes with optional filters
   */
  async getAllWorkCodes(filters?: WorkforceCodeSearchFilters): Promise<ApiResponse<WorkforceCode[]>> {
    return this.getAll(filters);
  }

  /**
   * Get work code by ID
   */
  async getWorkCodeById(id: number): Promise<ApiResponse<WorkforceCode>> {
    return this.getById(id);
  }

  /**
   * Create a new work code
   */
  async createWorkCode(data: CreateWorkforceCodeRequest): Promise<ApiResponse<WorkforceCode>> {
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
    data: UpdateWorkforceCodeRequest
  ): Promise<ApiResponse<WorkforceCode>> {
    // Use partial update for flexibility
    return this.update(id, data);
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
  async getWorkCodesByStatus(status: WorkforceCodeStatus): Promise<ApiResponse<WorkforceCode[]>> {
    return this.getAll({ status });
  }

  /**
   * Get work codes by code type
   */
  async getWorkCodesByType(codeType: CodeType): Promise<ApiResponse<WorkforceCode[]>> {
    return this.getAll({ codeType });
  }

  /**
   * Get active work codes only
   */
  async getActiveWorkCodes(): Promise<ApiResponse<WorkforceCode[]>> {
    return this.getAll({ status: 1 });
  }

  /**
   * Get inactive work codes only
   */
  async getInactiveWorkCodes(): Promise<ApiResponse<WorkforceCode[]>> {
    return this.getAll({ status: 0 });
  }

  /**
   * Search work codes by code or description
   */
  async searchWorkCodes(
    query: string,
    filters?: WorkforceCodeSearchFilters
  ): Promise<ApiResponse<WorkforceCode[]>> {
    return this.search(query, filters);
  }

  /**
   * Activate a work code
   */
  async activateWorkCode(id: number): Promise<ApiResponse<WorkforceCode>> {
    return this.partialUpdate(id, { status: 1 });
  }

  /**
   * Deactivate a work code
   */
  async deactivateWorkCode(id: number): Promise<ApiResponse<WorkforceCode>> {
    return this.partialUpdate(id, { status: 0 });
  }

  /**
   * Archive a work code
   */
  async archiveWorkCode(id: number): Promise<ApiResponse<WorkforceCode>> {
    return this.partialUpdate(id, { status: 3 });
  }

  /**
   * Get work codes expiring soon (within specified days)
   */
  async getExpiringWorkCodes(days: number = 30): Promise<ApiResponse<WorkforceCode[]>> {
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
    status: WorkforceCodeStatus
  ): Promise<ApiResponse<WorkforceCode[]>> {
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
  static getStatusLabel(status: WorkforceCodeStatus): string {
    const labels: Record<WorkforceCodeStatus, string> = {
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
  static getStatusColor(status: WorkforceCodeStatus): string {
    const colors: Record<WorkforceCodeStatus, string> = {
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
  static getStatusOptions(): Array<{ value: WorkforceCodeStatus; label: string }> {
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
  static validateWorkCode(data: CreateWorkforceCodeRequest | UpdateWorkforceCodeRequest): string | null {
    // Validate shortWorkforceCode format
    if ('shortWorkforceCode' in data && data.shortWorkforceCode) {
      if (data.shortWorkforceCode.length < 2) {
        return 'Short workforce code must be at least 2 characters long';
      }
      if (data.shortWorkforceCode.length > 50) {
        return 'Short workforce code must not exceed 50 characters';
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
  static isEffective(workCode: WorkforceCode): boolean {
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
  static isExpiringSoon(workCode: WorkforceCode, days: number = 30): boolean {
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
  static formatWorkCode(workCode: WorkforceCode): string {
    const parts: string[] = [workCode.shortWorkforceCode];

    if (workCode.description) {
      parts.push(workCode.description);
    }

    return parts.join(' - ');
  }

  /**
   * Parse work code from formatted string
   */
  static parseWorkCode(formatted: string): Partial<WorkforceCode> {
    const parts = formatted.split(' - ');
    const result: Partial<WorkforceCode> = {
      shortWorkforceCode: parts[0]?.trim(),
    };

    if (parts[1]) {
      result.description = parts[1].trim();
    }

    return result;
  }

  /**
   * Group work codes by code type
   */
  static groupByCodeType(workCodes: WorkforceCode[]): Record<string, WorkforceCode[]> {
    return workCodes.reduce((acc, workCode) => {
      const codeType = workCode.codeType || 'workCode';
      if (!acc[codeType]) {
        acc[codeType] = [];
      }
      acc[codeType].push(workCode);
      return acc;
    }, {} as Record<string, WorkforceCode[]>);
  }

  /**
   * Sort work codes by code
   */
  static sortByCode(workCodes: WorkforceCode[], ascending: boolean = true): WorkforceCode[] {
    return [...workCodes].sort((a, b) => {
      const comparison = a.shortWorkforceCode.localeCompare(b.shortWorkforceCode);
      return ascending ? comparison : -comparison;
    });
  }

  /**
   * Sort work codes by status
   */
  static sortByStatus(workCodes: WorkforceCode[], ascending: boolean = true): WorkforceCode[] {
    return [...workCodes].sort((a, b) => {
      const comparison = a.status - b.status;
      return ascending ? comparison : -comparison;
    });
  }

  /**
   * Filter work codes by status
   */
  static filterByStatus(workCodes: WorkforceCode[], status: WorkforceCodeStatus): WorkforceCode[] {
    return workCodes.filter(wc => wc.status === status);
  }

  /**
   * Filter active work codes
   */
  static filterActive(workCodes: WorkforceCode[]): WorkforceCode[] {
    return workCodes.filter(wc => wc.status === 1);
  }

  /**
   * Filter effective work codes
   */
  static filterEffective(workCodes: WorkforceCode[]): WorkforceCode[] {
    return workCodes.filter(wc => WorkCodeService.isEffective(wc));
  }
}

// ============================================================================
// Batch Work Code Service
// ============================================================================

export class WorkCodeBatchService extends BatchService<WorkforceCode> {
  constructor(client: HttpClient) {
    super(client, 'work-codes');
  }

  /**
   * Batch create work codes
   */
  async batchCreateWorkCodes(
    workCodes: CreateWorkforceCodeRequest[]
  ): Promise<ApiResponse<WorkforceCode[]>> {
    // Validate all work codes before creating
    for (const workCode of workCodes) {
      const validationError = WorkCodeService.validateWorkCode(workCode);
      if (validationError) {
        return {
          success: false,
          error: 'ValidationError',
          message: `Invalid work code "${workCode.shortWorkforceCode}": ${validationError}`,
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
    updates: Array<{ id: number; data: UpdateWorkforceCodeRequest }>
  ): Promise<ApiResponse<WorkforceCode[]>> {
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
  async batchActivateWorkCodes(ids: number[]): Promise<ApiResponse<WorkforceCode[]>> {
    const updates = ids.map(id => ({
      id,
      data: { status: 1 as WorkforceCodeStatus },
    }));
    return this.batchUpdate(updates);
  }

  /**
   * Batch deactivate work codes
   */
  async batchDeactivateWorkCodes(ids: number[]): Promise<ApiResponse<WorkforceCode[]>> {
    const updates = ids.map(id => ({
      id,
      data: { status: 0 as WorkforceCodeStatus },
    }));
    return this.batchUpdate(updates);
  }

  /**
   * Batch archive work codes
   */
  async batchArchiveWorkCodes(ids: number[]): Promise<ApiResponse<WorkforceCode[]>> {
    const updates = ids.map(id => ({
      id,
      data: { status: 3 as WorkforceCodeStatus },
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
