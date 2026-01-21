import { FieldConfig, ColumnConfig, ActionConfig } from './common.types';

export type CodeType = 'workCode' | 'accountCode';

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