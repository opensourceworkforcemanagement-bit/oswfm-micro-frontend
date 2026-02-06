// Generic entity with ID
export interface BaseEntity {
  id: number | string;
  [key: string]: any;
}

export interface FieldConfig {
  tab: string[];
  enabled: boolean;
  readonly: boolean;
  visible: boolean;
  label: string;
  hint: string;
  required: boolean;
  type?: 'text' | 'textarea' | 'select' | 'date' | 'number' | 'email' | 'password' | 'boolean' | 'file' | 'image' | 'url' | 'tel' | 'color' | 'time' | 'datetime-local' | 'month';
  options?: Array<{ value: string | number ; label: string }>;
  maxLength?: number;
  min?: number;
  max?: number;
}

export interface ColumnConfig {
  visible: boolean;
  label: string;
  width?: number;
  formatter?: (value: any) => string;
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

// Tab configuration
export interface TabConfig {
  id: string;
  label: string;
  visible: boolean;
  fields: string[]; // Array of field keys to display in this tab TODO: maybe FieldConfig
}

// Page configuration
interface PageConfig<T> {
  entityName: string; // e.g., "Work Code", "User", "Product"
  entityNamePlural: string; // e.g., "Work Codes", "Users", "Products"
  idField: keyof T; // The field that serves as the ID
  displayField: keyof T; // The field to use for display (e.g., name)
  columns: Record<string, ColumnConfig>;
  fields: Record<string, FieldConfig>;
  tabs: TabConfig[];
  actions: Record<string, ActionConfig>;
  pagination: {
    enabled: boolean;
    defaultPageSize: number;
    pageSizeOptions: number[];
  };
}

