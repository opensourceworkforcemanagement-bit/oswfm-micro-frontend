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
}