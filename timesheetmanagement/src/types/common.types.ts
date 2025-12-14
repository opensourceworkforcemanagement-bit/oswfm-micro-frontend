export interface FieldConfig {
  tab: string[];
  enabled: boolean;
  readonly: boolean;
  visible: boolean;
  label: string;
  hint: string;
  required: boolean;
}

export interface ColumnConfig {
  visible: boolean;
  label: string;
}

export interface ActionConfig {
  enabled: boolean;
  visible: boolean;
}

export interface PaginationConfig {
  enabled: boolean;
  defaultPageSize: number;
  pageSizeOptions: number[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: string | null;
  message: string;
  status?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  q?: string;
  [key: string]: any;
}