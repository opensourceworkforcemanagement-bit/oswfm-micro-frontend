import { FieldConfig, ColumnConfig, ActionConfig } from './common.types';

export type CodeType = 'workCode' | 'accountCode';

// Status type for WorkforceCode (0 = Inactive, 1 = Active, 2 = Pending, 3 = Archived)
export type WorkforceCodeStatus = 0 | 1 | 2 | 3;

export interface WorkforceCode {
  work_code_id: number;
  prefix: string;
  suffix: string;
  shortWorkforceCode: string;
  longWorkforceCode: string;
  description: string;
  status: number;
  effectiveDate: Date;
  expirationDate: Date;
  codeType: CodeType;
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