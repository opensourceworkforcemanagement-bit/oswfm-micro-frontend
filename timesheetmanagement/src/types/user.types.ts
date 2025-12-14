import { FieldConfig, ColumnConfig, ActionConfig, PaginationConfig } from './common.types';

export interface User {
  id: number;
  userName: string;
  firstName: string;
  lastName: string;
  role: string;
  org: string;
  status: string;
  hiringDate: string;
  lastDate: string;
  workerType: string;
}

export interface UserPageConfig {
  columns: Record<string, ColumnConfig>;
  fields: Record<string, FieldConfig>;
  filters: Record<string, FieldConfig>;
  roles: Record<string, { enabled: boolean; visible: boolean; label: string }>;
  workerTypes: Record<string, { enabled: boolean; visible: boolean; label: string }>;
  actions: Record<string, ActionConfig>;
  pagination: PaginationConfig;
}