import { FieldConfig, ColumnConfig, ActionConfig } from './common.types';

// Status type for WorkforceCode (0 = Inactive, 1 = Active, 2 = Pending, 3 = Archived)
export type WorkforceCodeStatus = 0 | 1 | 2 | 3;

export interface WorkforceCode {
  id: number;
  codeId: number;
  codeTypeId: number;
  prefix?: string;
  suffix?: string;
  shortCodeValue: string;
  longCodeValue: string;
  description: string;
  status: number;
  effectiveDate: Date;
  expirationDate: Date;
}

export interface WorkCodePageConfig {
  columns: Record<string, ColumnConfig>;
  fields: Record<string, FieldConfig>;
  actions: Record<string, ActionConfig>;
}

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