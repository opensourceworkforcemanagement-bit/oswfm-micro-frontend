import { WorkforceCode } from './workcode.types';

// Timesheet Status Types
export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'recalled';

export interface Employee {
  employeeId: number;
  firstName: string;
  lastName: string;
  email?: string;
  department?: string;
  employeeNumber?: string;
}

export interface PayPeriodType {
  payPeriodTypeId: number;
  payPeriodTypeName: string;
  description?: string;
}

export interface PayPeriod {
  payPeriodId: number;
  payPeriodTypeId: number;
  payPeriodType?: PayPeriodType;
  startDate: Date;
  endDate: Date;
  year: number;
  periodNumber: number;
}

export interface Weeks {
  week: number;
  sunHours: number;
  monHours: number;
  tueHours: number;
  wedHours: number;
  thuHours: number;
  friHours: number;
  satHours: number;
}

export interface TimesheetEntry {
  timesheetEntryId?: number;
  timesheetId?: number;
  workforceCode?: WorkforceCode;
  accountCode?: WorkforceCode;
  weeks: Weeks[];
}

export interface Timesheet {
  timesheetId: number;
  employeeId: number;
  employee?: Employee;
  payPeriodId: number;
  payPeriod?: PayPeriod;
  status: TimesheetStatus;
  timesheetEntries: TimesheetEntry[];
  submittedAt?: Date;
  approvedAt?: Date;
  approvedBy?: number;
  comments?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Summary type for directory listing
export interface TimesheetSummary {
  timesheetId: number;
  employeeId: number;
  employeeName: string;
  payPeriodId: number;
  payPeriodStartDate: Date;
  payPeriodEndDate: Date;
  status: TimesheetStatus;
  totalHours: number;
}

