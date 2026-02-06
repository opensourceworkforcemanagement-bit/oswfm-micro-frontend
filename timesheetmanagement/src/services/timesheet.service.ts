/**
 * Timesheet Service
 * Service for managing timesheets
 * Built on top of CommonService following SOLID principles
 */

import {
  HttpClient,
  CommonService,
  ApiResponse,
  SearchParams,
} from './common.services';

import {
  Timesheet,
  TimesheetEntry,
  TimesheetSummary,
  TimesheetStatus,
  PayPeriod,
  Weeks,
} from '../types/timesheet.types';

import { Employee } from '../types/employee.type.ts';

// ============================================================================
// Timesheet Types
// ============================================================================

export interface CreateTimesheetRequest {
  employeeId: number;
  payPeriodId: number;
  timesheetEntries?: TimesheetEntry[];
  comments?: string;
}

export interface UpdateTimesheetRequest {
  timesheetEntries?: TimesheetEntry[];
  status?: TimesheetStatus;
  comments?: string;
}

export interface TimesheetSearchFilters extends SearchParams {
  status?: TimesheetStatus;
  employeeId?: number;
  payPeriodId?: number;
  startDate?: string;
  endDate?: string;
}

// ============================================================================
// Timesheet Service Class
// ============================================================================

export class TimesheetService extends CommonService<Timesheet> {
  constructor(client: HttpClient) {
    super(client, 'timesheets-normalized');
  }

  // =========================================================================
  // CRUD Operations
  // =========================================================================

  /**
   * Get all timesheets with optional filters
   */
  async getAllTimesheets(filters?: TimesheetSearchFilters): Promise<ApiResponse<Timesheet[]>> {
    return this.getAll(filters);
  }

  /**
   * Get timesheet summaries for directory listing
   */
  async getTimesheetSummaries(filters?: TimesheetSearchFilters): Promise<ApiResponse<TimesheetSummary[]>> {
    return this.client.get<TimesheetSummary[]>(`/${this.resourcePath}/summaries`, filters);
  }

  /**
   * Get timesheet by ID
   */
  async getTimesheetById(id: number): Promise<ApiResponse<Timesheet>> {
    return this.getById(id);
  }

  /**
   * Create a new timesheet
   */
  async createTimesheet(data: CreateTimesheetRequest): Promise<ApiResponse<Timesheet>> {
    const validationError = TimesheetService.validateTimesheet(data);
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
   * Update an existing timesheet
   */
  async updateTimesheet(id: number, data: UpdateTimesheetRequest): Promise<ApiResponse<Timesheet>> {
    return this.update(id, data);
  }

  /**
   * Delete a timesheet
   */
  async deleteTimesheet(id: number): Promise<ApiResponse<void>> {
    return this.delete(id);
  }

  // =========================================================================
  // Status Operations
  // =========================================================================

  /**
   * Submit a timesheet for approval
   */
  async submitTimesheet(id: number): Promise<ApiResponse<Timesheet>> {
    return this.partialUpdate(id, { status: 'submitted' });
  }

  /**
   * Approve a timesheet
   */
  async approveTimesheet(id: number, approverId: number): Promise<ApiResponse<Timesheet>> {
    return this.client.post<Timesheet>(`/${this.resourcePath}/${id}/approve`, { approverId });
  }

  /**
   * Reject a timesheet
   */
  async rejectTimesheet(id: number, comments: string): Promise<ApiResponse<Timesheet>> {
    return this.client.post<Timesheet>(`/${this.resourcePath}/${id}/reject`, { comments });
  }

  /**
   * Recall a submitted timesheet
   */
  async recallTimesheet(id: number): Promise<ApiResponse<Timesheet>> {
    return this.partialUpdate(id, { status: 'recalled' });
  }

  // =========================================================================
  // Query Operations
  // =========================================================================

  /**
   * Get timesheets by status
   */
  async getTimesheetsByStatus(status: TimesheetStatus): Promise<ApiResponse<Timesheet[]>> {
    return this.getAll({ status });
  }

  /**
   * Get timesheets by employee
   */
  async getTimesheetsByEmployee(employeeId: number): Promise<ApiResponse<Timesheet[]>> {
    return this.getAll({ employeeId });
  }

  /**
   * Get timesheets by pay period
   */
  async getTimesheetsByPayPeriod(payPeriodId: number): Promise<ApiResponse<Timesheet[]>> {
    return this.getAll({ payPeriodId });
  }

  /**
   * Get current employee's timesheet for a pay period
   */
  async getCurrentTimesheet(employeeId: number, payPeriodId: number): Promise<ApiResponse<Timesheet>> {
    return this.client.get<Timesheet>(`/${this.resourcePath}/current`, { employeeId, payPeriodId });
  }

  // =========================================================================
  // Pay Period Operations
  // =========================================================================

  /**
   * Get all pay periods
   */
  async getPayPeriods(): Promise<ApiResponse<PayPeriod[]>> {
    return this.client.get<PayPeriod[]>('/pay-periods');
  }

  /**
   * Get current pay period
   */
  async getCurrentPayPeriod(): Promise<ApiResponse<PayPeriod>> {
    return this.client.get<PayPeriod>('/pay-periods/current');
  }

  // =========================================================================
  // Static Utility Methods
  // =========================================================================

  /**
   * Get human-readable status label
   */
  static getStatusLabel(status: TimesheetStatus): string {
    const labels: Record<TimesheetStatus, string> = {
      draft: 'Draft',
      submitted: 'Submitted',
      approved: 'Approved',
      rejected: 'Rejected',
      recalled: 'Recalled',
    };
    return labels[status] || 'Unknown';
  }

  /**
   * Get status color class (for UI)
   */
  static getStatusColor(status: TimesheetStatus): string {
    const colors: Record<TimesheetStatus, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      recalled: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get all available status options
   */
  static getStatusOptions(): Array<{ value: TimesheetStatus; label: string }> {
    return [
      { value: 'draft', label: 'Draft' },
      { value: 'submitted', label: 'Submitted' },
      { value: 'approved', label: 'Approved' },
      { value: 'rejected', label: 'Rejected' },
      { value: 'recalled', label: 'Recalled' },
    ];
  }

  /**
   * Validate timesheet data
   */
  static validateTimesheet(data: CreateTimesheetRequest | UpdateTimesheetRequest): string | null {
    if ('employeeId' in data && !data.employeeId) {
      return 'Employee is required';
    }

    if ('payPeriodId' in data && !data.payPeriodId) {
      return 'Pay period is required';
    }

    return null;
  }

  /**
   * Calculate total hours for a week
   */
  static calculateWeekTotal(week: Weeks): number {
    return (
      week.sunHours +
      week.monHours +
      week.tueHours +
      week.wedHours +
      week.thuHours +
      week.friHours +
      week.satHours
    );
  }

  /**
   * Calculate total hours for a timesheet entry
   */
  static calculateEntryTotal(entry: TimesheetEntry): number {
    return entry.weeks.reduce((total, week) => total + this.calculateWeekTotal(week), 0);
  }

  /**
   * Calculate total hours for a timesheet
   */
  static calculateTimesheetTotal(timesheet: Timesheet): number {
    return timesheet.timesheetEntries.reduce(
      (total, entry) => total + this.calculateEntryTotal(entry),
      0
    );
  }

  /**
   * Check if timesheet can be edited
   */
  static canEdit(timesheet: Timesheet): boolean {
    return timesheet.status === 'draft' || timesheet.status === 'rejected' || timesheet.status === 'recalled';
  }

  /**
   * Check if timesheet can be submitted
   */
  static canSubmit(timesheet: Timesheet): boolean {
    return timesheet.status === 'draft' || timesheet.status === 'rejected' || timesheet.status === 'recalled';
  }

  /**
   * Check if timesheet can be recalled
   */
  static canRecall(timesheet: Timesheet): boolean {
    return timesheet.status === 'submitted';
  }

  /**
   * Format pay period for display
   */
  static formatPayPeriod(payPeriod: PayPeriod): string {
    const startDate = new Date(payPeriod.startDate);
    const endDate = new Date(payPeriod.endDate);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  }

  /**
   * Create empty week structure
   */
  static createEmptyWeek(weekNumber: number): Weeks {
    return {
      week: weekNumber,
      sunHours: 0,
      monHours: 0,
      tueHours: 0,
      wedHours: 0,
      thuHours: 0,
      friHours: 0,
      satHours: 0,
    };
  }

  /**
   * Create empty timesheet entry
   */
  static createEmptyEntry(numWeeks: number = 2): TimesheetEntry {
    return {
      timesheetEntryId: undefined,
      timesheetId: undefined,
      workforceCode: undefined,
      accountCode: undefined,
      weeks: Array.from({ length: numWeeks }, (_, i) => this.createEmptyWeek(i + 1)),
    };
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export const createTimesheetService = (client: HttpClient): TimesheetService => {
  return new TimesheetService(client);
};

export default TimesheetService;
