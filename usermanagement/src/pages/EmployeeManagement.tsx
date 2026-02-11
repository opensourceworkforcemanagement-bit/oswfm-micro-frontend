import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MantineReactTable,
  useMantineReactTable,
  type MRT_ColumnDef,
} from 'mantine-react-table';
import { Box, MantineProvider } from '@mantine/core';
import { IconRefresh, IconPlus, IconArrowLeft, IconEdit } from '@tabler/icons-react';
import * as Select from '@radix-ui/react-select';
import * as Tabs from '@radix-ui/react-tabs';
import { ChevronDown, Check } from 'lucide-react';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import 'mantine-react-table/styles.css';

import { Employee, EmployeesRequest, CreateEmployeeWithUserRequest } from '../types/employee.types.ts';
import { createEmployeeService } from '../services/employee.service.ts';
import { createHttpClient, ApiResponse } from '../services/common.services.ts';
import '../themes/brand-a.css';
import '../index.css';
// Import centralized styles
import { commonClasses, themeClasses, combineClasses } from '../styles/styles.classes.ts';

// ============================================================================
// Types
// ============================================================================

interface FieldConfig {
  enabled: boolean;
  readonly: boolean;
  visible: boolean;
  label: string;
  hint: string;
  required: boolean;
}

interface ActionConfig {
  enabled: boolean;
  visible: boolean;
}

// ============================================================================
// Configuration Manager
// ============================================================================

class EmployeeManagementConfigManager {
  static getApiBaseUrl(): string {
    if (typeof window !== 'undefined' && (window as any).VITE_API_BASE_URL) {
      return (window as any).VITE_API_BASE_URL;
    }
    return 'http://localhost:1110/api/v1';
  }

  static getStatusLabel(status: number): string {
    return status === 1 ? 'Active' : 'Inactive';
  }

  static getStatusOptions(): { value: number; label: string }[] {
    return [
      { value: 1, label: 'Active' },
      { value: 0, label: 'Inactive' },
    ];
  }

  static getFields(): Record<string, FieldConfig> {
    return {
      employeeIdentifier: { enabled: true, readonly: false, visible: true, label: 'Employee ID', hint: 'Unique employee identifier', required: true },
      userName: { enabled: true, readonly: false, visible: true, label: 'Username', hint: 'Login username', required: true },
      firstName: { enabled: true, readonly: false, visible: true, label: 'First Name', hint: 'Employee first name', required: true },
      middleName: { enabled: true, readonly: false, visible: true, label: 'Middle Name', hint: 'Employee middle name', required: false },
      lastName: { enabled: true, readonly: false, visible: true, label: 'Last Name', hint: 'Employee last name', required: true },
      status: { enabled: true, readonly: false, visible: true, label: 'Status', hint: 'Active or Inactive', required: true },
    };
  }

  static getFieldConfig(key: string): FieldConfig | undefined {
    return this.getFields()[key];
  }

  static getActions(): Record<string, ActionConfig> {
    return {
      add: { enabled: true, visible: true },
      edit: { enabled: true, visible: true },
      save: { enabled: true, visible: true },
      cancel: { enabled: true, visible: true },
      editButton: { enabled: true, visible: true },
    };
  }

  static getActionConfig(key: string): ActionConfig | undefined {
    return this.getActions()[key];
  }

  static getPaginationConfig() {
    return {
      enabled: true,
      defaultPageSize: 10,
      pageSizeOptions: [10, 25, 50, 100],
    };
  }
}

// ============================================================================
// CSS Variables (consistent with UserManagement.tsx)
// ============================================================================

const cssVars = {
  '--color-primary': '#3b82f6',
  '--color-primary-hover': '#2563eb',
  '--color-primary-light': '#eff6ff',
  '--color-background': '#ffffff',
  '--color-surface': '#f8fafc',
  '--color-border': '#e2e8f0',
  '--color-border-focus': '#3b82f6',
  '--color-text': '#1e293b',
  '--color-text-secondary': '#64748b',
  '--color-text-muted': '#94a3b8',
  '--color-success': '#22c55e',
  '--color-success-bg': '#dcfce7',
  '--color-danger': '#ef4444',
  '--color-danger-bg': '#fee2e2',
  '--color-row-hover': '#f1f5f9',
  '--color-row-selected': '#dbeafe',
  '--color-tab-active': '#3b82f6',
  '--color-tab-inactive': '#64748b',
  '--spacing-xs': '4px',
  '--spacing-sm': '8px',
  '--spacing-md': '16px',
  '--spacing-lg': '24px',
  '--spacing-xl': '32px',
  '--radius-sm': '4px',
  '--radius-md': '6px',
  '--radius-lg': '8px',
  '--font-size-xs': '12px',
  '--font-size-sm': '14px',
  '--font-size-md': '16px',
  '--font-size-lg': '18px',
  '--font-size-xl': '24px',
  '--shadow-sm': '0 1px 2px rgba(0,0,0,0.05)',
  '--shadow-md': '0 4px 6px rgba(0,0,0,0.1)',
  '--transition-fast': '150ms ease',
  '--transition-normal': '200ms ease',
};

// ============================================================================
// Shared Components
// ============================================================================

const StatusBadge = ({ status }: { status: number }) => {
  const isActive = status === 1;
  const label = EmployeeManagementConfigManager.getStatusLabel(status);
  return (
    <span style={{
      padding: 'var(--spacing-xs) var(--spacing-sm)',
      borderRadius: 'var(--radius-sm)',
      fontSize: 'var(--font-size-xs)',
      fontWeight: 500,
      backgroundColor: isActive ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
      color: isActive ? 'var(--color-success)' : 'var(--color-danger)',
    }}>
      {label}
    </span>
  );
};

const InputField = ({ fieldKey, value, onChange, type = 'text' }: {
  fieldKey: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) => {
  const fieldConfig = EmployeeManagementConfigManager.getFieldConfig(fieldKey);
  if (!fieldConfig?.visible) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
      <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
        {fieldConfig.label}{fieldConfig.required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        disabled={!fieldConfig.enabled || fieldConfig.readonly}
        style={{
          padding: 'var(--spacing-sm) var(--spacing-md)',
          backgroundColor: fieldConfig.readonly ? 'var(--color-surface)' : 'var(--color-background)',
          border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-size-sm)', color: 'var(--color-text)', outline: 'none',
          opacity: fieldConfig.enabled ? 1 : 0.6,
          cursor: fieldConfig.enabled && !fieldConfig.readonly ? 'text' : 'not-allowed'
        }} />
      {fieldConfig.hint && <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{fieldConfig.hint}</span>}
    </div>
  );
};

const SelectField = ({ fieldKey, value, onChange, options }: {
  fieldKey: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) => {
  const fieldConfig = EmployeeManagementConfigManager.getFieldConfig(fieldKey);
  if (!fieldConfig?.visible) return null;
  const isDisabled = !fieldConfig.enabled || fieldConfig.readonly;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
      <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
        {fieldConfig.label}{fieldConfig.required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
      </label>
      <Select.Root value={value} onValueChange={onChange} disabled={!fieldConfig.enabled || fieldConfig.readonly}>
        <Select.Trigger className={combineClasses(
                commonClasses.workCodeSelectTrigger,
                isDisabled ? themeClasses.surface : themeClasses.background,
                themeClasses.border,
                themeClasses.textPrimary
              )}>
          <Select.Value placeholder={fieldConfig.label} />
          <Select.Icon><ChevronDown size={16} /></Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className={combineClasses(
                  commonClasses.workCodeSelectContent,
                  themeClasses.selectBackground,
                  themeClasses.border
                )}>
            <Select.Viewport className="p-1">
              {options.map(opt => (
                <Select.Item key={opt.value} value={opt.value} className={combineClasses(
                        commonClasses.workCodeSelectItem,
                        themeClasses.textPrimary
                      )}>
                  <Select.ItemIndicator><Check size={14} /></Select.ItemIndicator>
                  <Select.ItemText>{opt.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      {fieldConfig.hint && <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{fieldConfig.hint}</span>}
    </div>
  );
};

// ============================================================================
// Employee Directory (Table View)
// ============================================================================

const EmployeeDirectory = ({ employees, isLoading, error, onSelectEmployee, onAddNew, onRefresh }: {
  employees: Employee[];
  isLoading: boolean;
  error: string | null;
  onSelectEmployee: (employee: Employee) => void;
  onAddNew: () => void;
  onRefresh: () => void;
}) => {
  const addAction = EmployeeManagementConfigManager.getActionConfig('add');
  const editAction = EmployeeManagementConfigManager.getActionConfig('edit');
  const editButtonAction = EmployeeManagementConfigManager.getActionConfig('editButton');

  const columns = useMemo<MRT_ColumnDef<Employee>[]>(() => {
    const cols: MRT_ColumnDef<Employee>[] = [
      {
        accessorKey: 'employeeId',
        header: 'ID',
        size: 80,
        enableColumnFilter: false,
      },
      {
        accessorKey: 'employeeIdentifier',
        header: 'Employee ID',
        size: 150,
      },
      {
        accessorKey: 'userName',
        header: 'Username',
        size: 150,
      },
      {
        accessorKey: 'firstName',
        header: 'First Name',
        size: 150,
      },
      {
        accessorKey: 'middleName',
        header: 'Middle Name',
        size: 130,
      },
      {
        accessorKey: 'lastName',
        header: 'Last Name',
        size: 150,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 120,
        Cell: ({ cell }) => <StatusBadge status={cell.getValue<number>()} />,
        filterVariant: 'select',
        mantineFilterSelectProps: {
          data: [
            { value: '1', label: 'Active' },
            { value: '0', label: 'Inactive' },
          ],
        },
      },
    ];

    if (editButtonAction?.visible && editAction?.enabled) {
      cols.push({
        id: 'actions',
        header: 'Actions',
        size: 100,
        enableColumnFilter: false,
        enableSorting: false,
        Cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectEmployee(row.original);
            }}
            disabled={!editButtonAction.enabled}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              padding: 'var(--spacing-xs) var(--spacing-sm)', backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)', border: '1px solid var(--color-primary)',
              borderRadius: 'var(--radius-sm)', cursor: editButtonAction.enabled ? 'pointer' : 'not-allowed',
              fontSize: 'var(--font-size-xs)', fontWeight: 500, gap: 'var(--spacing-xs)',
              opacity: editButtonAction.enabled ? 1 : 0.6,
              transition: 'var(--transition-fast)',
            }}
          >
            <IconEdit size={14} /> Edit
          </button>
        ),
      });
    }

    return cols;
  }, [editAction, editButtonAction, onSelectEmployee]);

  const table = useMantineReactTable({
    columns,
    data: employees,
    enableColumnFilters: true,
    enableColumnFilterModes: false,
    enableGlobalFilter: true,
    enableSorting: true,
    enablePagination: true,
    enableEditing: false,
    enableRowSelection: false,
    enableRowActions: false,
    enableColumnOrdering: true,
    enableFullScreenToggle: false,
    enableDensityToggle: true,
    enableStickyHeader: true,
    enablePinning: false,
    enableColumnResizing: true,
    layoutMode: 'semantic',
    initialState: {
      density: 'xs',
      showGlobalFilter: true,
      pagination: { pageSize: 10, pageIndex: 0 },
      sorting: [{ id: 'lastName', desc: false }],
    },
    paginationDisplayMode: 'pages',
    state: {
      isLoading,
      showAlertBanner: !!error,
    },
    mantineToolbarAlertBannerProps: error
      ? { color: 'red', children: error }
      : undefined,
    mantineTableProps: {
      striped: true,
      withTableBorder: true,
      withColumnBorders: true,
    },
    mantineTableHeadCellProps: {
      align: 'center',
    },
    mantineTableBodyCellProps: {
      align: 'center',
    },
    mantineTableBodyRowProps: ({ row }) => ({
      onClick: editAction?.enabled ? () => onSelectEmployee(row.original) : undefined,
      style: { cursor: editAction?.enabled ? 'pointer' : 'default' },
    }),
    renderTopToolbarCustomActions: () => (
      <Box style={{ display: 'flex', gap: '16px', padding: '8px' }}>
        {addAction?.visible && (
          <button
            onClick={onAddNew}
            disabled={!addAction.enabled}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)',
              padding: 'var(--spacing-sm) var(--spacing-md)',
              backgroundColor: 'var(--color-primary)',
              color: 'white', border: 'none', borderRadius: 'var(--radius-md)',
              cursor: addAction.enabled ? 'pointer' : 'not-allowed',
              fontSize: 'var(--font-size-sm)', fontWeight: 500,
              opacity: addAction.enabled ? 1 : 0.6,
            }}
          >
            <IconPlus size={16} /> Add Employee
          </button>
        )}
        <button
          onClick={onRefresh}
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            backgroundColor: 'var(--color-background)',
            color: 'var(--color-text)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer', fontSize: 'var(--font-size-sm)',
          }}
        >
          <IconRefresh size={16} /> Refresh
        </button>
      </Box>
    ),
  });

  return (
    <div style={{ ...cssVars, padding: 'var(--spacing-lg)', backgroundColor: 'var(--color-surface)', minHeight: '100vh' } as React.CSSProperties}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-text)', fontWeight: 600 }}>
          Employee Directory
        </h1>
      </div>

      <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <MantineReactTable table={table} />
      </div>
    </div>
  );
};

// ============================================================================
// Generic Tab Form Input (not dependent on config manager)
// ============================================================================

const TabFormInput = ({ label, value, onChange, required = false, type = 'text' }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) => {
  const inputId = `tab-input-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
      <label htmlFor={inputId} style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
        {label}{required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
      </label>
      <input id={inputId} type={type} value={value} onChange={e => onChange(e.target.value)}
        style={{
          padding: 'var(--spacing-sm) var(--spacing-md)',
          backgroundColor: 'var(--color-background)',
          border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-size-sm)', color: 'var(--color-text)', outline: 'none',
        }} />
    </div>
  );
};

const TabSelectField = ({ label, value, onChange, options, required = false }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
    <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
      {label}{required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
    </label>
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger className={combineClasses(
                commonClasses.workCodeSelectTrigger,
                themeClasses.background,
                themeClasses.border,
                themeClasses.textPrimary
              )}>
        <Select.Value placeholder={label} />
        <Select.Icon><ChevronDown size={16} /></Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className={combineClasses(
                  commonClasses.workCodeSelectContent,
                  themeClasses.selectBackground,
                  themeClasses.border
                )}>
          <Select.Viewport style={{ padding: 'var(--spacing-xs)' }}>
            {options.map(opt => (
              <Select.Item key={opt.value} value={opt.value} className={combineClasses(
                        commonClasses.workCodeSelectItem,
                        themeClasses.textPrimary
                      )}>
                <Select.ItemIndicator><Check size={14} /></Select.ItemIndicator>
                <Select.ItemText>{opt.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  </div>
);

// ============================================================================
// Tab Form State Type
// ============================================================================

interface EmployeeFormState {
  employee: Partial<Employee>;
  createUser: boolean;
  password: string;
  address: Record<string, string>;
  department: Record<string, string>;
  emailAddress: Record<string, string>;
  employeeAddress: Record<string, string>;
  auditLog: Record<string, string>;
  emergencyContact: Record<string, string>;
  emergencyContactEmail: Record<string, string>;
  emergencyContactPhone: Record<string, string>;
  preference: Record<string, string>;
  role: Record<string, string>;
  setting: Record<string, string>;
  ssn: Record<string, string>;
  statusHistory: Record<string, string>;
  organization: Record<string, string>;
  permission: Record<string, string>;
  phoneNumber: Record<string, string>;
  project: Record<string, string>;
  rolePermission: Record<string, string>;
  employeeUser: Record<string, string>;
}

const createInitialFormState = (employee: Employee | null): EmployeeFormState => ({
  employee: employee || { employeeIdentifier: '', userName: '', firstName: '', middleName: '', lastName: '', status: 1 },
  createUser: false,
  password: '',
  address: { addressLine1: '', addressLine2: '', city: '', state: '', zipCode: '', country: '', isPrimary: 'false' },
  department: { department: '', description: '', status: '1' },
  emailAddress: { employeeId: '', email: '', type: '', isPrimary: 'false' },
  employeeAddress: { employeeId: '' },
  auditLog: { employeeId: '', action: '', actionTimestamp: '', actionBy: '' },
  emergencyContact: { employeeId: '', firstName: '', middleName: '', lastName: '', relationship: '' },
  emergencyContactEmail: { emergencyContactId: '', emailAddressId: '' },
  emergencyContactPhone: { emergencyContactId: '', phoneNumberId: '' },
  preference: { employeeId: '', preferenceKey: '', preferenceDescription: '' },
  role: { role: '', description: '' },
  setting: { employeeId: '', settingKey: '', settingDescription: '' },
  ssn: { employeeId: '', ssn: '' },
  statusHistory: { employeeId: '', status: '', changedAt: '', changedByEmployeeId: '' },
  organization: { parentOrganizationId: '', organization: '', description: '', status: '1' },
  permission: { permissionTag: '', permissionName: '', description: '' },
  phoneNumber: { employeeId: '', phoneNumber: '', type: '', isPrimary: 'false' },
  project: { project: '', description: '', startDate: '', endDate: '', status: '1' },
  rolePermission: { employeeRoleId: '', permissioinsId: '' },
  employeeUser: { employeeId: '', userId: '' },
});

// ============================================================================
// Employee Form (Add/Edit View)
// ============================================================================

const tabStyle: React.CSSProperties = {
  padding: 'var(--spacing-sm) var(--spacing-lg)', border: 'none', backgroundColor: 'transparent',
  fontSize: 'var(--font-size-sm)', fontWeight: 500, cursor: 'pointer',
  borderBottom: '2px solid transparent', color: 'var(--color-tab-active)',
};

const gridStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', maxWidth: '600px',
};

const statusSelectOptions = [
  { value: '1', label: 'Active' },
  { value: '0', label: 'Inactive' },
];

const boolSelectOptions = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

const EmployeeForm = ({ employee, onSave, onCancel, isNew }: {
  employee: Employee | null;
  onSave: (data: Partial<Employee>, createUser: boolean, password: string) => void;
  onCancel: () => void;
  isNew: boolean;
}) => {
  const [formState, setFormState] = useState<EmployeeFormState>(() => createInitialFormState(employee));
  const [validationError, setValidationError] = useState<string | null>(null);

  const saveAction = EmployeeManagementConfigManager.getActionConfig('save');
  const cancelAction = EmployeeManagementConfigManager.getActionConfig('cancel');
  const statusOptions = EmployeeManagementConfigManager.getStatusOptions();

  const updateEmployeeField = (field: string, value: string | number) =>
    setFormState(prev => ({ ...prev, employee: { ...prev.employee, [field]: value } }));

  const updateTabField = (tab: keyof Omit<EmployeeFormState, 'employee' | 'createUser' | 'password'>, field: string, value: string) =>
    setFormState(prev => ({ ...prev, [tab]: { ...prev[tab], [field]: value } }));

  const handleSave = () => {
    if (!saveAction?.enabled) return;
    setValidationError(null);
    if (formState.createUser && !formState.password.trim()) {
      setValidationError('Password is required when "Create User" is checked.');
      return;
    }
    onSave(formState.employee, formState.createUser, formState.password);
  };

  return (
    <div style={{ ...cssVars, padding: 'var(--spacing-lg)', backgroundColor: 'var(--color-surface)', minHeight: '100vh' } as React.CSSProperties}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <button onClick={onCancel} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'var(--spacing-sm)', backgroundColor: 'var(--color-background)',
          border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
        }}>
          <IconArrowLeft size={18} />
        </button>
        <h1 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-text)', fontWeight: 600 }}>
          {isNew ? 'Add New Employee' : 'Edit Employee'}
        </h1>
      </div>

      <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
        <Tabs.Root defaultValue="employee">
          <Tabs.List style={{ display: 'flex', flexWrap: 'wrap', borderBottom: '15px solid var(--color-border)', padding: '0 var(--spacing-md)' }}>
            <Tabs.Trigger value="employee" style={tabStyle}>Employee</Tabs.Trigger>
            <Tabs.Trigger value="address" style={tabStyle}>Address</Tabs.Trigger>
            <Tabs.Trigger value="department" style={tabStyle}>Department</Tabs.Trigger>
            <Tabs.Trigger value="emailAddress" style={tabStyle}>Email</Tabs.Trigger>
            <Tabs.Trigger value="employeeAddress" style={tabStyle}>Emp. Address</Tabs.Trigger>
            <Tabs.Trigger value="auditLog" style={tabStyle}>Audit Log</Tabs.Trigger>
            <Tabs.Trigger value="emergencyContact" style={tabStyle}>Emergency Contact</Tabs.Trigger>
            <Tabs.Trigger value="emergencyContactEmail" style={tabStyle}>EC Email</Tabs.Trigger>
            <Tabs.Trigger value="emergencyContactPhone" style={tabStyle}>EC Phone</Tabs.Trigger>
            <Tabs.Trigger value="preference" style={tabStyle}>Preferences</Tabs.Trigger>
            <Tabs.Trigger value="role" style={tabStyle}>Roles</Tabs.Trigger>
            <Tabs.Trigger value="setting" style={tabStyle}>Settings</Tabs.Trigger>
            <Tabs.Trigger value="ssn" style={tabStyle}>SSN</Tabs.Trigger>
            <Tabs.Trigger value="statusHistory" style={tabStyle}>Status History</Tabs.Trigger>
            <Tabs.Trigger value="organization" style={tabStyle}>Organization</Tabs.Trigger>
            <Tabs.Trigger value="permission" style={tabStyle}>Permission</Tabs.Trigger>
            <Tabs.Trigger value="phoneNumber" style={tabStyle}>Phone Number</Tabs.Trigger>
            <Tabs.Trigger value="project" style={tabStyle}>Project</Tabs.Trigger>
            <Tabs.Trigger value="rolePermission" style={tabStyle}>Role Permission</Tabs.Trigger>
            <Tabs.Trigger value="employeeUser" style={tabStyle}>Employee User</Tabs.Trigger>
          </Tabs.List>

          <div style={{ padding: 'var(--spacing-lg)' }}>
            {/* Employee Tab */}
            <Tabs.Content value="employee">
              <div style={gridStyle}>
                <InputField fieldKey="employeeIdentifier" value={formState.employee.employeeIdentifier || ''} onChange={v => updateEmployeeField('employeeIdentifier', v)} />
                <InputField fieldKey="userName" value={formState.employee.userName || ''} onChange={v => updateEmployeeField('userName', v)} />
                <InputField fieldKey="firstName" value={formState.employee.firstName || ''} onChange={v => updateEmployeeField('firstName', v)} />
                <InputField fieldKey="middleName" value={formState.employee.middleName || ''} onChange={v => updateEmployeeField('middleName', v)} />
                <InputField fieldKey="lastName" value={formState.employee.lastName || ''} onChange={v => updateEmployeeField('lastName', v)} />
                <SelectField fieldKey="status" value={String(formState.employee.status ?? 1)} onChange={v => updateEmployeeField('status', Number(v))} options={statusOptions.map(o => ({ value: String(o.value), label: o.label }))} />
              </div>
              {isNew && (
                <div style={{ marginTop: 'var(--spacing-lg)', maxWidth: '600px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                    <input
                      id="createUser"
                      type="checkbox"
                      checked={formState.createUser}
                      onChange={e => setFormState(prev => ({
                        ...prev,
                        createUser: e.target.checked,
                        password: e.target.checked ? prev.password : '',
                      }))}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <label htmlFor="createUser" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text)', fontWeight: 500, cursor: 'pointer' }}>
                      Create User
                    </label>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                    <label htmlFor="password" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                      Password{formState.createUser && <span style={{ color: 'var(--color-danger)' }}> *</span>}
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={formState.password}
                      onChange={e => setFormState(prev => ({ ...prev, password: e.target.value }))}
                      disabled={!formState.createUser}
                      style={{
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        backgroundColor: formState.createUser ? 'var(--color-background)' : 'var(--color-surface)',
                        border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-sm)', color: 'var(--color-text)', outline: 'none',
                        opacity: formState.createUser ? 1 : 0.6,
                        cursor: formState.createUser ? 'text' : 'not-allowed',
                        maxWidth: '285px',
                      }}
                    />
                  </div>
                  {validationError && (
                    <div style={{ marginTop: 'var(--spacing-sm)', color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)' }}>
                      {validationError}
                    </div>
                  )}
                </div>
              )}
            </Tabs.Content>

            {/* Address Tab */}
            <Tabs.Content value="address">
              <div style={gridStyle}>
                <TabFormInput label="Address Line 1" value={formState.address.addressLine1} onChange={v => updateTabField('address', 'addressLine1', v)} required />
                <TabFormInput label="Address Line 2" value={formState.address.addressLine2} onChange={v => updateTabField('address', 'addressLine2', v)} />
                <TabFormInput label="City" value={formState.address.city} onChange={v => updateTabField('address', 'city', v)} required />
                <TabFormInput label="State" value={formState.address.state} onChange={v => updateTabField('address', 'state', v)} required />
                <TabFormInput label="Zip Code" value={formState.address.zipCode} onChange={v => updateTabField('address', 'zipCode', v)} required />
                <TabFormInput label="Country" value={formState.address.country} onChange={v => updateTabField('address', 'country', v)} required />
                <TabSelectField label="Is Primary" value={formState.address.isPrimary} onChange={v => updateTabField('address', 'isPrimary', v)} options={boolSelectOptions} />
              </div>
            </Tabs.Content>

            {/* Department Tab */}
            <Tabs.Content value="department">
              <div style={gridStyle}>
                <TabFormInput label="Department" value={formState.department.department} onChange={v => updateTabField('department', 'department', v)} required />
                <TabFormInput label="Description" value={formState.department.description} onChange={v => updateTabField('department', 'description', v)} />
                <TabSelectField label="Status" value={formState.department.status} onChange={v => updateTabField('department', 'status', v)} options={statusSelectOptions} required />
              </div>
            </Tabs.Content>

            {/* Email Address Tab */}
            <Tabs.Content value="emailAddress">
              <div style={gridStyle}>
                <TabFormInput label="Employee ID" value={formState.emailAddress.employeeId} onChange={v => updateTabField('emailAddress', 'employeeId', v)} required />
                <TabFormInput label="Email" value={formState.emailAddress.email} onChange={v => updateTabField('emailAddress', 'email', v)} required type="email" />
                <TabFormInput label="Type" value={formState.emailAddress.type} onChange={v => updateTabField('emailAddress', 'type', v)} required />
                <TabSelectField label="Is Primary" value={formState.emailAddress.isPrimary} onChange={v => updateTabField('emailAddress', 'isPrimary', v)} options={boolSelectOptions} />
              </div>
            </Tabs.Content>

            {/* Employee Address (Join) Tab */}
            <Tabs.Content value="employeeAddress">
              <div style={gridStyle}>
                <TabFormInput label="Employee ID" value={formState.employeeAddress.employeeId} onChange={v => updateTabField('employeeAddress', 'employeeId', v)} required />
              </div>
            </Tabs.Content>

            {/* Audit Log Tab */}
            <Tabs.Content value="auditLog">
              <div style={gridStyle}>
                <TabFormInput label="Employee ID" value={formState.auditLog.employeeId} onChange={v => updateTabField('auditLog', 'employeeId', v)} required />
                <TabFormInput label="Action" value={formState.auditLog.action} onChange={v => updateTabField('auditLog', 'action', v)} required />
                <TabFormInput label="Action Timestamp" value={formState.auditLog.actionTimestamp} onChange={v => updateTabField('auditLog', 'actionTimestamp', v)} type="datetime-local" />
                <TabFormInput label="Action By" value={formState.auditLog.actionBy} onChange={v => updateTabField('auditLog', 'actionBy', v)} />
              </div>
            </Tabs.Content>

            {/* Emergency Contact Tab */}
            <Tabs.Content value="emergencyContact">
              <div style={gridStyle}>
                <TabFormInput label="Employee ID" value={formState.emergencyContact.employeeId} onChange={v => updateTabField('emergencyContact', 'employeeId', v)} required />
                <TabFormInput label="First Name" value={formState.emergencyContact.firstName} onChange={v => updateTabField('emergencyContact', 'firstName', v)} />
                <TabFormInput label="Middle Name" value={formState.emergencyContact.middleName} onChange={v => updateTabField('emergencyContact', 'middleName', v)} />
                <TabFormInput label="Last Name" value={formState.emergencyContact.lastName} onChange={v => updateTabField('emergencyContact', 'lastName', v)} />
                <TabFormInput label="Relationship" value={formState.emergencyContact.relationship} onChange={v => updateTabField('emergencyContact', 'relationship', v)} />
              </div>
            </Tabs.Content>

            {/* Emergency Contact Email Tab */}
            <Tabs.Content value="emergencyContactEmail">
              <div style={gridStyle}>
                <TabFormInput label="Emergency Contact ID" value={formState.emergencyContactEmail.emergencyContactId} onChange={v => updateTabField('emergencyContactEmail', 'emergencyContactId', v)} required />
                <TabFormInput label="Email Address ID" value={formState.emergencyContactEmail.emailAddressId} onChange={v => updateTabField('emergencyContactEmail', 'emailAddressId', v)} required />
              </div>
            </Tabs.Content>

            {/* Emergency Contact Phone Tab */}
            <Tabs.Content value="emergencyContactPhone">
              <div style={gridStyle}>
                <TabFormInput label="Emergency Contact ID" value={formState.emergencyContactPhone.emergencyContactId} onChange={v => updateTabField('emergencyContactPhone', 'emergencyContactId', v)} required />
                <TabFormInput label="Phone Number ID" value={formState.emergencyContactPhone.phoneNumberId} onChange={v => updateTabField('emergencyContactPhone', 'phoneNumberId', v)} required />
              </div>
            </Tabs.Content>

            {/* Preferences Tab */}
            <Tabs.Content value="preference">
              <div style={gridStyle}>
                <TabFormInput label="Employee ID" value={formState.preference.employeeId} onChange={v => updateTabField('preference', 'employeeId', v)} required />
                <TabFormInput label="Preference Key" value={formState.preference.preferenceKey} onChange={v => updateTabField('preference', 'preferenceKey', v)} required />
                <TabFormInput label="Preference Description" value={formState.preference.preferenceDescription} onChange={v => updateTabField('preference', 'preferenceDescription', v)} />
              </div>
            </Tabs.Content>

            {/* Roles Tab */}
            <Tabs.Content value="role">
              <div style={gridStyle}>
                <TabFormInput label="Role" value={formState.role.role} onChange={v => updateTabField('role', 'role', v)} required />
                <TabFormInput label="Description" value={formState.role.description} onChange={v => updateTabField('role', 'description', v)} />
              </div>
            </Tabs.Content>

            {/* Settings Tab */}
            <Tabs.Content value="setting">
              <div style={gridStyle}>
                <TabFormInput label="Employee ID" value={formState.setting.employeeId} onChange={v => updateTabField('setting', 'employeeId', v)} required />
                <TabFormInput label="Setting Key" value={formState.setting.settingKey} onChange={v => updateTabField('setting', 'settingKey', v)} required />
                <TabFormInput label="Setting Description" value={formState.setting.settingDescription} onChange={v => updateTabField('setting', 'settingDescription', v)} />
              </div>
            </Tabs.Content>

            {/* SSN Tab */}
            <Tabs.Content value="ssn">
              <div style={gridStyle}>
                <TabFormInput label="Employee ID" value={formState.ssn.employeeId} onChange={v => updateTabField('ssn', 'employeeId', v)} required />
                <TabFormInput label="SSN" value={formState.ssn.ssn} onChange={v => updateTabField('ssn', 'ssn', v)} required />
              </div>
            </Tabs.Content>

            {/* Status History Tab */}
            <Tabs.Content value="statusHistory">
              <div style={gridStyle}>
                <TabFormInput label="Employee ID" value={formState.statusHistory.employeeId} onChange={v => updateTabField('statusHistory', 'employeeId', v)} required />
                <TabSelectField label="Status" value={formState.statusHistory.status} onChange={v => updateTabField('statusHistory', 'status', v)} options={statusSelectOptions} required />
                <TabFormInput label="Changed At" value={formState.statusHistory.changedAt} onChange={v => updateTabField('statusHistory', 'changedAt', v)} type="datetime-local" />
                <TabFormInput label="Changed By Employee ID" value={formState.statusHistory.changedByEmployeeId} onChange={v => updateTabField('statusHistory', 'changedByEmployeeId', v)} />
              </div>
            </Tabs.Content>

            {/* Organization Tab */}
            <Tabs.Content value="organization">
              <div style={gridStyle}>
                <TabFormInput label="Parent Organization ID" value={formState.organization.parentOrganizationId} onChange={v => updateTabField('organization', 'parentOrganizationId', v)} />
                <TabFormInput label="Organization" value={formState.organization.organization} onChange={v => updateTabField('organization', 'organization', v)} required />
                <TabFormInput label="Description" value={formState.organization.description} onChange={v => updateTabField('organization', 'description', v)} />
                <TabSelectField label="Status" value={formState.organization.status} onChange={v => updateTabField('organization', 'status', v)} options={statusSelectOptions} required />
              </div>
            </Tabs.Content>

            {/* Permission Tab */}
            <Tabs.Content value="permission">
              <div style={gridStyle}>
                <TabFormInput label="Permission Tag" value={formState.permission.permissionTag} onChange={v => updateTabField('permission', 'permissionTag', v)} required />
                <TabFormInput label="Permission Name" value={formState.permission.permissionName} onChange={v => updateTabField('permission', 'permissionName', v)} required />
                <TabFormInput label="Description" value={formState.permission.description} onChange={v => updateTabField('permission', 'description', v)} />
              </div>
            </Tabs.Content>

            {/* Phone Number Tab */}
            <Tabs.Content value="phoneNumber">
              <div style={gridStyle}>
                <TabFormInput label="Employee ID" value={formState.phoneNumber.employeeId} onChange={v => updateTabField('phoneNumber', 'employeeId', v)} required />
                <TabFormInput label="Phone Number" value={formState.phoneNumber.phoneNumber} onChange={v => updateTabField('phoneNumber', 'phoneNumber', v)} required type="tel" />
                <TabFormInput label="Type" value={formState.phoneNumber.type} onChange={v => updateTabField('phoneNumber', 'type', v)} required />
                <TabSelectField label="Is Primary" value={formState.phoneNumber.isPrimary} onChange={v => updateTabField('phoneNumber', 'isPrimary', v)} options={boolSelectOptions} />
              </div>
            </Tabs.Content>

            {/* Project Tab */}
            <Tabs.Content value="project">
              <div style={gridStyle}>
                <TabFormInput label="Project" value={formState.project.project} onChange={v => updateTabField('project', 'project', v)} required />
                <TabFormInput label="Description" value={formState.project.description} onChange={v => updateTabField('project', 'description', v)} />
                <TabFormInput label="Start Date" value={formState.project.startDate} onChange={v => updateTabField('project', 'startDate', v)} type="date" />
                <TabFormInput label="End Date" value={formState.project.endDate} onChange={v => updateTabField('project', 'endDate', v)} type="date" />
                <TabSelectField label="Status" value={formState.project.status} onChange={v => updateTabField('project', 'status', v)} options={statusSelectOptions} required />
              </div>
            </Tabs.Content>

            {/* Role Permission Tab */}
            <Tabs.Content value="rolePermission">
              <div style={gridStyle}>
                <TabFormInput label="Employee Role ID" value={formState.rolePermission.employeeRoleId} onChange={v => updateTabField('rolePermission', 'employeeRoleId', v)} required />
                <TabFormInput label="Permission ID" value={formState.rolePermission.permissioinsId} onChange={v => updateTabField('rolePermission', 'permissioinsId', v)} required />
              </div>
            </Tabs.Content>

            {/* Employee User Tab */}
            <Tabs.Content value="employeeUser">
              <div style={gridStyle}>
                <TabFormInput label="Employee ID" value={formState.employeeUser.employeeId} onChange={v => updateTabField('employeeUser', 'employeeId', v)} required />
                <TabFormInput label="User ID" value={formState.employeeUser.userId} onChange={v => updateTabField('employeeUser', 'userId', v)} required />
              </div>
            </Tabs.Content>
          </div>
        </Tabs.Root>

        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)',
          padding: 'var(--spacing-lg)', borderTop: '1px solid var(--color-border)',
        }}>
          {cancelAction?.visible && (
            <button onClick={onCancel} disabled={!cancelAction.enabled} style={{
              padding: 'var(--spacing-sm) var(--spacing-lg)', backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
              cursor: cancelAction.enabled ? 'pointer' : 'not-allowed',
              fontSize: 'var(--font-size-sm)', color: 'var(--color-text)',
              opacity: cancelAction.enabled ? 1 : 0.6,
            }}>Cancel</button>
          )}
          {saveAction?.visible && (
            <button onClick={handleSave} disabled={!saveAction.enabled} style={{
              padding: 'var(--spacing-sm) var(--spacing-lg)', backgroundColor: 'var(--color-primary)',
              border: 'none', borderRadius: 'var(--radius-md)',
              cursor: saveAction.enabled ? 'pointer' : 'not-allowed',
              fontSize: 'var(--font-size-sm)', color: 'white', fontWeight: 500,
              opacity: saveAction.enabled ? 1 : 0.6,
            }}>Save</button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<'directory' | 'form'>('directory');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const employeeService = useMemo(() => {
    const baseUrl = EmployeeManagementConfigManager.getApiBaseUrl();
    const httpClient = createHttpClient({ baseURL: baseUrl, timeout: 30000 });
    return createEmployeeService(httpClient);
  }, []);

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response: ApiResponse<Employee[]> = await employeeService.getAllEmployees();
      if (response.success && response.data) {
        setEmployees(response.data);
      } else {
        setError(response.message || 'Failed to load employees');
      }
    } catch (err) {
      setError('An unexpected error occurred while loading employees');
    } finally {
      setIsLoading(false);
    }
  }, [employeeService]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleSelectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setCurrentPage('form');
  };

  const handleAddNew = () => {
    setSelectedEmployee(null);
    setCurrentPage('form');
  };

  const handleSave = async (employeeData: Partial<Employee>, createUser: boolean, password: string) => {

    const request: EmployeesRequest = {
        employeeIdentifier: employeeData.employeeIdentifier ?? '',
        firstName: employeeData.firstName,
        middleName: employeeData.middleName,
        lastName: employeeData.lastName,
        status: employeeData.status,
        userName: employeeData.userName ?? '',
      };

    if (selectedEmployee) {
      await employeeService.updateEmployee(selectedEmployee.employeeId, request);
      setEmployees(employees.map(e =>
        e.employeeId === selectedEmployee.employeeId ? { ...selectedEmployee, ...employeeData } : e
      ));
    } else {
      if (createUser) {
        const createWithUserRequest: CreateEmployeeWithUserRequest = {
          ...request,
          createUser: true,
          password,
        };
        const response = await employeeService.createEmployeeWithUser(createWithUserRequest);
        if (response.success && response.data) {
          setEmployees([...employees, response.data]);
        } else {
          const msg = response.error || response.message || 'Failed to create employee with user';
          setError(msg.includes('already taken') ? 'Username is already taken. Please choose a different username.' : msg);
          return;
        }
      } else {
        const response = await employeeService.createEmployee(request);
        if (response.success && response.data) {
          setEmployees([...employees, response.data]);
        }
      }
    }
    setCurrentPage('directory');
    setSelectedEmployee(null);
  };

  const handleCancel = () => {
    setCurrentPage('directory');
    setSelectedEmployee(null);
  };

  return (
    <MantineProvider>
      {currentPage === 'directory'
        ? <EmployeeDirectory
            employees={employees}
            isLoading={isLoading}
            error={error}
            onSelectEmployee={handleSelectEmployee}
            onAddNew={handleAddNew}
            onRefresh={fetchEmployees}
          />
        : <EmployeeForm
            employee={selectedEmployee}
            onSave={handleSave}
            onCancel={handleCancel}
            isNew={!selectedEmployee}
          />
      }
    </MantineProvider>
  );
}
