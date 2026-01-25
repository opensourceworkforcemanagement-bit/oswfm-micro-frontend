import React, { useState, useRef, useCallback } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Select from '@radix-ui/react-select';
import * as Checkbox from '@radix-ui/react-checkbox';
import { ChevronDown, Check, Plus, ArrowLeft, Search, Edit, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import { ReactTabulator } from 'react-tabulator';
import 'react-tabulator/lib/styles.css';
import 'react-tabulator/lib/css/tabulator.min.css';
import "tailwindcss";

// Types
interface ColumnConfig {
  visible: boolean;
  label: string;
}

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

interface PageConfig {
  columns: Record<string, ColumnConfig>;
  fields: Record<string, FieldConfig>;
  filters: Record<string, FieldConfig>;
  roles: Record<string, { enabled: boolean; visible: boolean; label: string }>;
  workerTypes: Record<string, { enabled: boolean; visible: boolean; label: string }>;
  actions: Record<string, ActionConfig>;
  pagination: {
    enabled: boolean;
    defaultPageSize: number;
    pageSizeOptions: number[];
  };
}

// Configuration Manager for User Management
class UserManagementConfigManager {
  static getApiBaseUrl(): string {
    if (typeof window !== 'undefined' && (window as any).VITE_API_BASE_URL) {
      return (window as any).VITE_API_BASE_URL;
    }
    return 'http://localhost:1110/api/v1';
  }

  static getDefaultPageConfig(): PageConfig {
    return {
      columns: {
        userName: { visible: true, label: 'Username' },
        firstName: { visible: true, label: 'First Name' },
        lastName: { visible: true, label: 'Last Name' },
        role: { visible: true, label: 'Role' },
        org: { visible: true, label: 'Organization' },
        status: { visible: true, label: 'Status' }
      },
      filters: {
        userName: { enabled: true, readonly: false, visible: true, label: 'Username', hint: '', required: false },
        firstName: { enabled: true, readonly: false, visible: true, label: 'First Name', hint: '', required: false },
        lastName: { enabled: true, readonly: false, visible: true, label: 'Last Name', hint: '', required: false },
        org: { enabled: true, readonly: false, visible: true, label: 'Organization', hint: '', required: false },
        role: { enabled: true, readonly: false, visible: true, label: 'Role', hint: '', required: false },
        status: { enabled: true, readonly: false, visible: true, label: 'Status', hint: '', required: false }
      },
      fields: {
        userName: { enabled: true, readonly: false, visible: true, label: 'Username', hint: 'Unique identifier for the user', required: true },
        firstName: { enabled: true, readonly: false, visible: true, label: 'First Name', hint: 'User first name', required: true },
        lastName: { enabled: true, readonly: false, visible: true, label: 'Last Name', hint: 'User last name', required: true },
        org: { enabled: true, readonly: false, visible: true, label: 'Organization', hint: 'Select organization', required: true },
        status: { enabled: true, readonly: false, visible: true, label: 'Status', hint: 'Active or Inactive', required: true },
        hiringDate: { enabled: true, readonly: false, visible: true, label: 'Hiring Date', hint: 'Date employee was hired', required: true },
        lastDate: { enabled: true, readonly: false, visible: true, label: 'Last Date', hint: 'Last working date (if applicable)', required: false },
        workerType: { enabled: true, readonly: false, visible: true, label: 'Type of Worker', hint: 'Employment type', required: true }
      },
      roles: {
        Admin: { enabled: true, visible: true, label: 'Administrator' },
        Developer: { enabled: true, visible: true, label: 'Developer' },
        Supervisor: { enabled: true, visible: true, label: 'Supervisor' },
        TimeKeeper: { enabled: true, visible: true, label: 'Time Keeper' }
      },
      workerTypes: {
        Hourly: { enabled: true, visible: true, label: 'Hourly' },
        'Full Time': { enabled: true, visible: true, label: 'Full Time' },
        'Part Time': { enabled: true, visible: true, label: 'Part Time' }
      },
      pagination: {
        enabled: true,
        defaultPageSize: 10,
        pageSizeOptions: [10, 25, 100]
      },
      actions: {
        add: { enabled: true, visible: true },
        edit: { enabled: true, visible: true },
        delete: { enabled: true, visible: true },
        save: { enabled: true, visible: true },
        cancel: { enabled: true, visible: true },
        rowClickToEdit: { enabled: true, visible: true },
        editButton: { enabled: true, visible: true }
      }
    };
  }

  static getColumnConfig(key: string): ColumnConfig | undefined {
    return this.getDefaultPageConfig().columns[key];
  }

  static getFieldConfig(key: string): FieldConfig | undefined {
    return this.getDefaultPageConfig().fields[key];
  }

  static getFilterConfig(key: string): FieldConfig | undefined {
    return this.getDefaultPageConfig().filters[key];
  }

  static getActionConfig(key: string): ActionConfig | undefined {
    return this.getDefaultPageConfig().actions[key];
  }

  static getVisibleColumns(): string[] {
    const config = this.getDefaultPageConfig();
    return Object.entries(config.columns).filter(([_, c]) => c.visible).map(([k]) => k);
  }

  static getVisibleFilters(): string[] {
    const config = this.getDefaultPageConfig();
    return Object.entries(config.filters).filter(([_, f]) => f.visible).map(([k]) => k);
  }

  static getVisibleFields(): string[] {
    const config = this.getDefaultPageConfig();
    return Object.entries(config.fields).filter(([_, f]) => f.visible).map(([k]) => k);
  }

  static getAvailableRoles(): string[] {
    const config = this.getDefaultPageConfig();
    return Object.entries(config.roles).filter(([_, r]) => r.visible && r.enabled).map(([k]) => k);
  }

  static getAvailableWorkerTypes(): string[] {
    const config = this.getDefaultPageConfig();
    return Object.entries(config.workerTypes).filter(([_, w]) => w.visible && w.enabled).map(([k]) => k);
  }

  static getPaginationConfig() {
    return this.getDefaultPageConfig().pagination;
  }
}

// CSS Variables
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

const sampleUsers = [
  { id: 1, userName: 'jsmith', firstName: 'John', lastName: 'Smith', role: 'Admin', org: 'Engineering', status: 'Active', hiringDate: '2022-01-15', lastDate: '', workerType: 'Full Time' },
  { id: 2, userName: 'mjohnson', firstName: 'Mary', lastName: 'Johnson', role: 'Developer', org: 'Engineering', status: 'Active', hiringDate: '2021-06-20', lastDate: '', workerType: 'Full Time' },
  { id: 3, userName: 'rwilliams', firstName: 'Robert', lastName: 'Williams', role: 'Supervisor', org: 'Operations', status: 'Active', hiringDate: '2020-03-10', lastDate: '', workerType: 'Full Time' },
  { id: 4, userName: 'lbrown', firstName: 'Linda', lastName: 'Brown', role: 'TimeKeeper', org: 'HR', status: 'Inactive', hiringDate: '2019-11-05', lastDate: '2024-08-15', workerType: 'Part Time' },
  { id: 5, userName: 'dgarcia', firstName: 'David', lastName: 'Garcia', role: 'Developer', org: 'Engineering', status: 'Active', hiringDate: '2023-02-28', lastDate: '', workerType: 'Hourly' },
  { id: 6, userName: 'smartinez', firstName: 'Sarah', lastName: 'Martinez', role: 'Admin', org: 'Finance', status: 'Active', hiringDate: '2021-09-12', lastDate: '', workerType: 'Full Time' },
];

const orgs = ['Engineering', 'Operations', 'HR', 'Finance', 'Sales'];
const statuses = ['Active', 'Inactive'];

const config = UserManagementConfigManager.getDefaultPageConfig();

const ALL_DEFAULT = '__all__';

const SelectField = ({ fieldKey, value, onChange, options, placeholder, isFilter = false, showAllOption = false }) => {
  const fieldConfig = isFilter ? config.filters[fieldKey] : config.fields[fieldKey];
  if (!fieldConfig?.visible) return null;

  const handleChange = (val) => {
    onChange(val === ALL_DEFAULT ? '' : val);
  };

  const displayValue = (isFilter && showAllOption && !value) ? ALL_DEFAULT : value;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
      {!isFilter && <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
        {fieldConfig.label}{fieldConfig.required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
      </label>}
      <Select.Root value={displayValue} onValueChange={handleChange} disabled={!fieldConfig.enabled || fieldConfig.readonly}>
        <Select.Trigger style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--spacing-sm) var(--spacing-md)', backgroundColor: fieldConfig.readonly ? 'var(--color-surface)' : 'var(--color-background)',
          border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-size-sm)', color: (value || (isFilter && showAllOption)) ? 'var(--color-text)' : 'var(--color-text-muted)',
          cursor: fieldConfig.enabled && !fieldConfig.readonly ? 'pointer' : 'not-allowed', minWidth: '140px',
          opacity: fieldConfig.enabled ? 1 : 0.6
        }}>
          <Select.Value placeholder={placeholder || fieldConfig.label} />
          <Select.Icon><ChevronDown size={16} /></Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content style={{
            backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)', overflow: 'hidden', zIndex: 1000
          }}>
            <Select.Viewport style={{ padding: 'var(--spacing-xs)' }}>
              {showAllOption && (
                <Select.Item value={ALL_DEFAULT} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: 'var(--font-size-sm)', cursor: 'pointer', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                  <Select.ItemIndicator><Check size={14} /></Select.ItemIndicator>
                  <Select.ItemText>All (default)</Select.ItemText>
                </Select.Item>
              )}
              {options.map(opt => (
                <Select.Item key={opt} value={opt} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: 'var(--font-size-sm)', cursor: 'pointer', borderRadius: 'var(--radius-sm)', color: 'var(--color-text)' }}>
                  <Select.ItemIndicator><Check size={14} /></Select.ItemIndicator>
                  <Select.ItemText>{opt}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      {!isFilter && fieldConfig.hint && <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{fieldConfig.hint}</span>}
    </div>
  );
};

const InputField = ({ fieldKey, value, onChange, type = 'text', isFilter = false }) => {
  const fieldConfig = isFilter ? config.filters[fieldKey] : config.fields[fieldKey];
  if (!fieldConfig?.visible) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
      {!isFilter && <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
        {fieldConfig.label}{fieldConfig.required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
      </label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} 
        placeholder={isFilter ? fieldConfig.label : ''} disabled={!fieldConfig.enabled || fieldConfig.readonly}
        style={{
          padding: 'var(--spacing-sm) var(--spacing-md)', 
          backgroundColor: fieldConfig.readonly ? 'var(--color-surface)' : 'var(--color-background)',
          border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-size-sm)', color: 'var(--color-text)', outline: 'none',
          opacity: fieldConfig.enabled ? 1 : 0.6,
          cursor: fieldConfig.enabled && !fieldConfig.readonly ? 'text' : 'not-allowed'
        }} />
      {!isFilter && fieldConfig.hint && <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{fieldConfig.hint}</span>}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const isActive = status === 'Active';
  return (
    <span style={{
      padding: 'var(--spacing-xs) var(--spacing-sm)', borderRadius: 'var(--radius-sm)',
      fontSize: 'var(--font-size-xs)', fontWeight: 500,
      backgroundColor: isActive ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
      color: isActive ? 'var(--color-success)' : 'var(--color-danger)'
    }}>{status}</span>
  );
};

const UserDirectory = ({ users, onSelectUser, onAddNew }) => {
  const [filters, setFilters] = useState({ userName: '', firstName: '', lastName: '', org: '', role: '', status: '' });
  const [appliedFilters, setAppliedFilters] = useState({ userName: '', firstName: '', lastName: '', org: '', role: '', status: '' });
  const [selectedId, setSelectedId] = useState(null);
  const tableRef = useRef(null);
  
  const paginationConfig = UserManagementConfigManager.getPaginationConfig();
  const [pageSize, setPageSize] = useState(paginationConfig.defaultPageSize);
  
  const visibleColumns = UserManagementConfigManager.getVisibleColumns();
  const roles = UserManagementConfigManager.getAvailableRoles();
  const addAction = UserManagementConfigManager.getActionConfig('add');
  const editAction = UserManagementConfigManager.getActionConfig('edit');
  const rowClickToEdit = UserManagementConfigManager.getActionConfig('rowClickToEdit');
  const editButtonAction = UserManagementConfigManager.getActionConfig('editButton');

  const handleSearch = () => {
    setAppliedFilters({ ...filters });
  };

  const handleClear = () => {
    const cleared = { userName: '', firstName: '', lastName: '', org: '', role: '', status: '' };
    setFilters(cleared);
    setAppliedFilters(cleared);
  };

  const filteredUsers = users.filter(u => {
    return (!appliedFilters.userName || u.userName.toLowerCase().includes(appliedFilters.userName.toLowerCase())) &&
      (!appliedFilters.firstName || u.firstName.toLowerCase().includes(appliedFilters.firstName.toLowerCase())) &&
      (!appliedFilters.lastName || u.lastName.toLowerCase().includes(appliedFilters.lastName.toLowerCase())) &&
      (!appliedFilters.org || u.org === appliedFilters.org) &&
      (!appliedFilters.role || u.role === appliedFilters.role) &&
      (!appliedFilters.status || u.status === appliedFilters.status);
  });

  const handleRowClick = useCallback((row) => {
    if (!editAction?.enabled || !rowClickToEdit?.enabled) return;
    setSelectedId(row.id);
    onSelectUser(row);
  }, [editAction, rowClickToEdit, onSelectUser]);

  const handleEditClick = useCallback((e, user) => {
    e.stopPropagation();
    if (!editAction?.enabled || !editButtonAction?.enabled) return;
    setSelectedId(user.id);
    onSelectUser(user);
  }, [editAction, editButtonAction, onSelectUser]);

  const isRowClickable = editAction?.enabled && rowClickToEdit?.enabled;
  const showEditColumn = editButtonAction?.visible && editAction?.enabled;

  // Build Tabulator columns from config
  const tabulatorColumns = visibleColumns.map(col => {
    const colConfig = config.columns[col];
    if (col === 'status') {
      return {
        title: colConfig.label,
        field: col,
        formatter: 'reactFormatter',
        formatterParams: {
          renderFunction: (row) => <StatusBadge status={row.status} />
        },
        headerSort: true,
        width: 120
      };
    }
    return {
      title: colConfig.label,
      field: col,
      headerSort: true,
      headerFilter: false
    };
  });

  // Add edit button column if configured
  if (showEditColumn) {
    tabulatorColumns.push({
      title: 'Actions',
      field: 'actions',
      formatter: 'reactFormatter',
      formatterParams: {
        renderFunction: (row) => (
          <button 
            onClick={(e) => handleEditClick(e, row)} 
            disabled={!editButtonAction.enabled}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              padding: 'var(--spacing-xs) var(--spacing-sm)', backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)', border: '1px solid var(--color-primary)',
              borderRadius: 'var(--radius-sm)', cursor: editButtonAction.enabled ? 'pointer' : 'not-allowed',
              fontSize: 'var(--font-size-xs)', fontWeight: 500, gap: 'var(--spacing-xs)',
              opacity: editButtonAction.enabled ? 1 : 0.6,
              transition: 'var(--transition-fast)'
            }}
          >
            <Edit size={14} /> Edit
          </button>
        )
      },
      headerSort: false,
      width: 100,
      hozAlign: 'center'
    });
  }

  // Tabulator options
  const tabulatorOptions = {
    layout: 'fitColumns',
    responsiveLayout: 'hide',
    pagination: 'local',
    paginationSize: 10,
    paginationSizeSelector: [5, 10, 20, 50],
    movableColumns: true,
    resizableRows: false,
    selectable: 1,
    placeholder: 'No users found'
  };

  return (
    <div style={{ ...cssVars, padding: 'var(--spacing-lg)', backgroundColor: 'var(--color-surface)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-text)', fontWeight: 600 }}>User Directory</h1>
        {addAction?.visible && (
          <button onClick={onAddNew} disabled={!addAction.enabled} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)',
            padding: 'var(--spacing-sm) var(--spacing-md)', backgroundColor: 'var(--color-primary)',
            color: 'white', border: 'none', borderRadius: 'var(--radius-md)', 
            cursor: addAction.enabled ? 'pointer' : 'not-allowed',
            fontSize: 'var(--font-size-sm)', fontWeight: 500, opacity: addAction.enabled ? 1 : 0.6
          }}><Plus size={16} /> Add User</button>
        )}
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${UserManagementConfigManager.getVisibleFilters().length}, 1fr)`, gap: 'var(--spacing-md)',
        padding: 'var(--spacing-md)', backgroundColor: 'var(--color-background)',
        borderRadius: 'var(--radius-lg)', marginBottom: 'var(--spacing-md)', boxShadow: 'var(--shadow-sm)'
      }}>
        <InputField fieldKey="userName" value={filters.userName} onChange={v => setFilters({...filters, userName: v})} isFilter />
        <InputField fieldKey="firstName" value={filters.firstName} onChange={v => setFilters({...filters, firstName: v})} isFilter />
        <InputField fieldKey="lastName" value={filters.lastName} onChange={v => setFilters({...filters, lastName: v})} isFilter />
        <SelectField fieldKey="org" value={filters.org} onChange={v => setFilters({...filters, org: v})} options={orgs} isFilter showAllOption />
        <SelectField fieldKey="role" value={filters.role} onChange={v => setFilters({...filters, role: v})} options={roles} isFilter showAllOption />
        <SelectField fieldKey="status" value={filters.status} onChange={v => setFilters({...filters, status: v})} options={statuses} isFilter showAllOption />
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
        <button onClick={handleSearch} style={{
          display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)',
          padding: 'var(--spacing-sm) var(--spacing-md)', backgroundColor: 'var(--color-primary)',
          color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
          fontSize: 'var(--font-size-sm)', fontWeight: 500
        }}><Search size={16} /> Search</button>
        <button onClick={handleClear} style={{
          padding: 'var(--spacing-sm) var(--spacing-md)', backgroundColor: 'var(--color-background)',
          color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', 
          cursor: 'pointer', fontSize: 'var(--font-size-sm)'
        }}>Clear</button>
      </div>

      <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <ReactTabulator
          ref={tableRef}
          data={filteredUsers}
          columns={tabulatorColumns}
          options={tabulatorOptions}
          onRowClick={isRowClickable ? handleRowClick : undefined}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
};

const UserForm = ({ user, onSave, onCancel, isNew }) => {
  const [formData, setFormData] = useState(user || {
    userName: '', firstName: '', lastName: '', org: '', status: 'Active',
    role: '', hiringDate: '', lastDate: '', workerType: ''
  });
  const [selectedRoles, setSelectedRoles] = useState(user?.role ? [user.role] : []);
  
  const availableRoles = UserManagementConfigManager.getAvailableRoles();
  const availableWorkerTypes = UserManagementConfigManager.getAvailableWorkerTypes();
  const saveAction = UserManagementConfigManager.getActionConfig('save');
  const cancelAction = UserManagementConfigManager.getActionConfig('cancel');

  const updateField = (field, value) => setFormData({...formData, [field]: value});
  const toggleRole = (role) => {
    if (!config.roles[role]?.enabled) return;
    setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const handleSave = () => {
    if (!saveAction?.enabled) return;
    onSave({ ...formData, role: selectedRoles[0] || '' });
  };

  const tabStyle = {
    padding: 'var(--spacing-sm) var(--spacing-lg)', border: 'none', backgroundColor: 'transparent',
    fontSize: 'var(--font-size-sm)', fontWeight: 500, cursor: 'pointer',
    borderBottom: '2px solid transparent', color: 'var(--color-tab-inactive)'
  };

  return (
    <div style={{ ...cssVars, padding: 'var(--spacing-lg)', backgroundColor: 'var(--color-surface)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <button onClick={onCancel} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'var(--spacing-sm)', backgroundColor: 'var(--color-background)',
          border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer'
        }}><ArrowLeft size={18} /></button>
        <h1 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-text)', fontWeight: 600 }}>
          {isNew ? 'Add New User' : 'Edit User'}
        </h1>
      </div>

      <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
        <Tabs.Root defaultValue="user">
          <Tabs.List style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', padding: '0 var(--spacing-md)' }}>
            <Tabs.Trigger value="user" style={tabStyle}>User</Tabs.Trigger>
            <Tabs.Trigger value="roles" style={tabStyle}>Roles</Tabs.Trigger>
            <Tabs.Trigger value="settings" style={tabStyle}>Settings</Tabs.Trigger>
          </Tabs.List>

          <div style={{ padding: 'var(--spacing-lg)' }}>
            <Tabs.Content value="user">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', maxWidth: '600px' }}>
                <InputField fieldKey="userName" value={formData.userName} onChange={v => updateField('userName', v)} />
                <SelectField fieldKey="status" value={formData.status} onChange={v => updateField('status', v)} options={statuses} />
                <InputField fieldKey="firstName" value={formData.firstName} onChange={v => updateField('firstName', v)} />
                <InputField fieldKey="lastName" value={formData.lastName} onChange={v => updateField('lastName', v)} />
                <SelectField fieldKey="org" value={formData.org} onChange={v => updateField('org', v)} options={orgs} />
              </div>
            </Tabs.Content>

            <Tabs.Content value="roles">
              <div style={{ maxWidth: '400px' }}>
                <h3 style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text)', marginBottom: 'var(--spacing-md)' }}>Select Roles</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                  {availableRoles.map(role => {
                    const roleConfig = config.roles[role];
                    return (
                      <label key={role} style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)',
                        padding: 'var(--spacing-md)', backgroundColor: 'var(--color-surface)',
                        borderRadius: 'var(--radius-md)', cursor: roleConfig.enabled ? 'pointer' : 'not-allowed',
                        opacity: roleConfig.enabled ? 1 : 0.6
                      }}>
                        <Checkbox.Root checked={selectedRoles.includes(role)} onCheckedChange={() => toggleRole(role)}
                          disabled={!roleConfig.enabled}
                          style={{
                            width: 20, height: 20, backgroundColor: 'var(--color-background)',
                            border: '2px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                          <Checkbox.Indicator><Check size={14} color="var(--color-primary)" /></Checkbox.Indicator>
                        </Checkbox.Root>
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>{roleConfig.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </Tabs.Content>

            <Tabs.Content value="settings">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', maxWidth: '600px' }}>
                <InputField fieldKey="hiringDate" type="date" value={formData.hiringDate} onChange={v => updateField('hiringDate', v)} />
                <InputField fieldKey="lastDate" type="date" value={formData.lastDate} onChange={v => updateField('lastDate', v)} />
                <SelectField fieldKey="workerType" value={formData.workerType} onChange={v => updateField('workerType', v)} options={availableWorkerTypes} />
              </div>
            </Tabs.Content>
          </div>
        </Tabs.Root>

        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)',
          padding: 'var(--spacing-lg)', borderTop: '1px solid var(--color-border)'
        }}>
          {cancelAction?.visible && (
            <button onClick={onCancel} disabled={!cancelAction.enabled} style={{
              padding: 'var(--spacing-sm) var(--spacing-lg)', backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', 
              cursor: cancelAction.enabled ? 'pointer' : 'not-allowed',
              fontSize: 'var(--font-size-sm)', color: 'var(--color-text)',
              opacity: cancelAction.enabled ? 1 : 0.6
            }}>Cancel</button>
          )}
          {saveAction?.visible && (
            <button onClick={handleSave} disabled={!saveAction.enabled} style={{
              padding: 'var(--spacing-sm) var(--spacing-lg)', backgroundColor: 'var(--color-primary)',
              border: 'none', borderRadius: 'var(--radius-md)', 
              cursor: saveAction.enabled ? 'pointer' : 'not-allowed',
              fontSize: 'var(--font-size-sm)', color: 'white', fontWeight: 500,
              opacity: saveAction.enabled ? 1 : 0.6
            }}>Save</button>
          )}
        </div>
      </div>
      	<Select.Root defaultValue="apple">
		<Select.Trigger color="indigo" variant="soft" />
		<Select.Content color="indigo">
			<Select.Item value="apple">Apple</Select.Item>
			<Select.Item value="orange">Orange</Select.Item>
		</Select.Content>
	</Select.Root>
    </div>
    
  );
};

export default function UserManagement() {
  const [users, setUsers] = useState(sampleUsers);
  const [currentPage, setCurrentPage] = useState('directory');
  const [selectedUser, setSelectedUser] = useState(null);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setCurrentPage('form');
  };

  const handleAddNew = () => {
    setSelectedUser(null);
    setCurrentPage('form');
  };

  const handleSave = (userData) => {
    if (selectedUser) {
      setUsers(users.map(u => u.id === selectedUser.id ? { ...userData, id: selectedUser.id } : u));
    } else {
      setUsers([...users, { ...userData, id: Date.now() }]);
    }
    setCurrentPage('directory');
  };

  const handleCancel = () => {
    setCurrentPage('directory');
    setSelectedUser(null);
  };

  return currentPage === 'directory' 
    ? <UserDirectory users={users} onSelectUser={handleSelectUser} onAddNew={handleAddNew} />
    : <UserForm user={selectedUser} onSave={handleSave} onCancel={handleCancel} isNew={!selectedUser} />;
}