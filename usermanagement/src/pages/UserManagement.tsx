import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MantineReactTable,
  useMantineReactTable,
  type MRT_ColumnDef,
} from 'mantine-react-table';
import { Box, MantineProvider } from '@mantine/core';
import { IconRefresh, IconPlus, IconArrowLeft, IconEdit, IconTrash } from '@tabler/icons-react';
import * as Select from '@radix-ui/react-select';
import * as Tabs from '@radix-ui/react-tabs';
import * as Checkbox from '@radix-ui/react-checkbox';
import { ChevronDown, Check } from 'lucide-react';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import 'mantine-react-table/styles.css';

import {
  User,
  UserProfileSetting,
  UserGroupDTO,
  UserGroupMembershipDTO,
  SubjectAttributeDTO,
  UserSubjectAttributeDTO,
  OrganizationDTO,
  CustomResponse,
  createUserService,
  UserService,
} from '../services/user.service.ts';
import { createHttpClient, ApiResponse } from '../services/common.services.ts';
import "tailwindcss";

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

class UserManagementConfigManager {
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
      userName: { enabled: true, readonly: false, visible: true, label: 'Username', hint: 'Unique identifier for the user', required: true },
      firstName: { enabled: true, readonly: false, visible: true, label: 'First Name', hint: 'User first name', required: true },
      middleName: { enabled: true, readonly: false, visible: true, label: 'Middle Name', hint: 'User middle name', required: false },
      lastName: { enabled: true, readonly: false, visible: true, label: 'Last Name', hint: 'User last name', required: true },
      email: { enabled: true, readonly: false, visible: true, label: 'Email', hint: 'User email address', required: false },
      userStatus: { enabled: true, readonly: false, visible: true, label: 'Status', hint: 'Active or Inactive', required: true },
      password: { enabled: true, readonly: false, visible: true, label: 'Password', hint: 'User password (min 8 characters)', required: true },
      org: { enabled: true, readonly: false, visible: true, label: 'Organization', hint: 'Select organization', required: false },
      hiringDate: { enabled: true, readonly: false, visible: true, label: 'Hiring Date', hint: 'Date employee was hired', required: false },
      lastDate: { enabled: true, readonly: false, visible: true, label: 'Last Date', hint: 'Last working date (if applicable)', required: false },
      workerType: { enabled: true, readonly: false, visible: true, label: 'Type of Worker', hint: 'Employment type', required: false },
    };
  }

  static getFieldConfig(key: string): FieldConfig | undefined {
    return this.getFields()[key];
  }

  static getActions(): Record<string, ActionConfig> {
    return {
      add: { enabled: true, visible: true },
      edit: { enabled: true, visible: true },
      delete: { enabled: true, visible: true },
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

  static getWorkerTypes(): string[] {
    return ['Hourly', 'Full Time', 'Part Time'];
  }
}

// ============================================================================
// CSS Variables
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
  const label = UserManagementConfigManager.getStatusLabel(status);
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
  const fieldConfig = UserManagementConfigManager.getFieldConfig(fieldKey);
  if (!fieldConfig?.visible) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
      <label htmlFor={`field-${fieldKey}`} style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
        {fieldConfig.label}{fieldConfig.required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
      </label>
      <input id={`field-${fieldKey}`} type={type} value={value} onChange={e => onChange(e.target.value)}
        disabled={!fieldConfig.enabled || fieldConfig.readonly}
        style={{
          padding: 'var(--spacing-sm) var(--spacing-md)',
          backgroundColor: fieldConfig.readonly ? 'var(--color-surface)' : 'var(--color-background)',
          border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-size-sm)', color: 'var(--color-text)', outline: 'none',
          opacity: fieldConfig.enabled ? 1 : 0.6,
          cursor: fieldConfig.enabled && !fieldConfig.readonly ? 'text' : 'not-allowed',
        }} />
      {fieldConfig.hint && <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{fieldConfig.hint}</span>}
    </div>
  );
};

const SelectFieldForm = ({ label, value, onChange, options, required = false, disabled = false }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
    <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
      {label}{required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
    </label>
    <Select.Root value={value} onValueChange={onChange} disabled={disabled}>
      <Select.Trigger style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'var(--spacing-sm) var(--spacing-md)', backgroundColor: 'var(--color-background)',
        border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-sm)', color: value ? 'var(--color-text)' : 'var(--color-text-muted)',
        cursor: disabled ? 'not-allowed' : 'pointer', minWidth: '140px',
        opacity: disabled ? 0.6 : 1,
      }}>
        <Select.Value placeholder={label} />
        <Select.Icon><ChevronDown size={16} /></Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content style={{
          backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)', overflow: 'hidden', zIndex: 1000,
        }}>
          <Select.Viewport style={{ padding: 'var(--spacing-xs)' }}>
            {options.map(opt => (
              <Select.Item key={opt.value} value={opt.value} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)',
                padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: 'var(--font-size-sm)',
                cursor: 'pointer', borderRadius: 'var(--radius-sm)', color: 'var(--color-text)',
              }}>
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
// User Directory (Table View)
// ============================================================================

const UserDirectory = ({ users, isLoading, error, onSelectUser, onAddNew, onRefresh, onDeleteUser }: {
  users: User[];
  isLoading: boolean;
  error: string | null;
  onSelectUser: (user: User) => void;
  onAddNew: () => void;
  onRefresh: () => void;
  onDeleteUser: (userId: number) => void;
}) => {
  const addAction = UserManagementConfigManager.getActionConfig('add');
  const editAction = UserManagementConfigManager.getActionConfig('edit');
  const editButtonAction = UserManagementConfigManager.getActionConfig('editButton');
  const deleteAction = UserManagementConfigManager.getActionConfig('delete');

  const columns = useMemo<MRT_ColumnDef<User>[]>(() => {
    const cols: MRT_ColumnDef<User>[] = [
      {
        accessorKey: 'userId',
        header: 'ID',
        size: 80,
        enableColumnFilter: false,
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
        accessorKey: 'lastName',
        header: 'Last Name',
        size: 150,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        size: 200,
      },
      {
        accessorKey: 'userStatus',
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
        size: 150,
        enableColumnFilter: false,
        enableSorting: false,
        Cell: ({ row }) => (
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectUser(row.original);
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
            {deleteAction?.visible && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (row.original.userId && confirm(`Delete user "${row.original.userName}"?`)) {
                    onDeleteUser(row.original.userId);
                  }
                }}
                disabled={!deleteAction.enabled}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  padding: 'var(--spacing-xs) var(--spacing-sm)', backgroundColor: 'var(--color-danger-bg)',
                  color: 'var(--color-danger)', border: '1px solid var(--color-danger)',
                  borderRadius: 'var(--radius-sm)', cursor: deleteAction.enabled ? 'pointer' : 'not-allowed',
                  fontSize: 'var(--font-size-xs)', fontWeight: 500, gap: 'var(--spacing-xs)',
                  opacity: deleteAction.enabled ? 1 : 0.6,
                  transition: 'var(--transition-fast)',
                }}
              >
                <IconTrash size={14} /> Delete
              </button>
            )}
          </div>
        ),
      });
    }

    return cols;
  }, [editAction, editButtonAction, deleteAction, onSelectUser, onDeleteUser]);

  const table = useMantineReactTable({
    columns,
    data: users,
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
      onClick: editAction?.enabled ? () => onSelectUser(row.original) : undefined,
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
            <IconPlus size={16} /> Add User
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
          User Directory
        </h1>
      </div>

      <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <MantineReactTable table={table} />
      </div>
    </div>
  );
};

// ============================================================================
// Tab Styles
// ============================================================================

const tabStyle: React.CSSProperties = {
  padding: 'var(--spacing-sm) var(--spacing-lg)', border: 'none', backgroundColor: 'transparent',
  fontSize: 'var(--font-size-sm)', fontWeight: 500, cursor: 'pointer',
  borderBottom: '2px solid transparent', color: 'var(--color-tab-inactive)',
};

const gridStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', maxWidth: '600px',
};

// ============================================================================
// User Form (Add/Edit View)
// ============================================================================

const UserForm = ({ user, userService, onSave, onCancel, isNew }: {
  user: User | null;
  userService: UserService;
  onSave: (userData: Partial<User>, password?: string) => void;
  onCancel: () => void;
  isNew: boolean;
}) => {
  // User tab state
  const [formData, setFormData] = useState<Partial<User>>(() => user || {
    userName: '', firstName: '', middleName: '', lastName: '', email: '', userStatus: 1,
  });
  const [password, setPassword] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [organizations, setOrganizations] = useState<OrganizationDTO[]>([]);

  // Roles tab state
  const [roleAttributes, setRoleAttributes] = useState<SubjectAttributeDTO[]>([]);
  const [userRoleIds, setUserRoleIds] = useState<Set<number>>(new Set());
  const [rolesLoading, setRolesLoading] = useState(false);

  // Settings tab state
  const [settings, setSettings] = useState<Record<string, string>>({
    hiringDate: '', lastDate: '', workerType: '',
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Groups tab state
  const [allGroups, setAllGroups] = useState<UserGroupDTO[]>([]);
  const [userMemberships, setUserMemberships] = useState<UserGroupMembershipDTO[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const saveAction = UserManagementConfigManager.getActionConfig('save');
  const cancelAction = UserManagementConfigManager.getActionConfig('cancel');
  const statusOptions = UserManagementConfigManager.getStatusOptions();
  const workerTypes = UserManagementConfigManager.getWorkerTypes();

  const userId = user?.userId;

  // Load organizations on mount
  useEffect(() => {
    const loadOrganizations = async () => {
      const response = await userService.getAllOrganizations();
      if (response.success && response.data) {
        setOrganizations(response.data);
      }
    };
    loadOrganizations();
  }, [userService]);

  // Load data for existing user
  useEffect(() => {
    if (!userId) return;

    const loadUserData = async () => {
      // Load profile settings (org, hiringDate, lastDate, workerType)
      setSettingsLoading(true);
      const settingsResponse = await userService.getProfileSettings(userId);
      if (settingsResponse.success && settingsResponse.data?.response) {
        const settingsMap: Record<string, string> = {};
        let orgId = '';
        for (const s of settingsResponse.data.response) {
          if (s.settingKey === 'organizationId') {
            orgId = s.settingValue;
          } else {
            settingsMap[s.settingKey] = s.settingValue;
          }
        }
        setSettings(prev => ({ ...prev, ...settingsMap }));
        setSelectedOrgId(orgId);
      }
      setSettingsLoading(false);

      // Load roles
      setRolesLoading(true);
      const [roleAttrsResponse, userAttrsResponse] = await Promise.all([
        userService.getSubjectAttributesByAttributeName('role'),
        userService.getResolvedAttributesForUser(userId),
      ]);
      if (roleAttrsResponse.success && roleAttrsResponse.data) {
        setRoleAttributes(roleAttrsResponse.data);
      }
      if (userAttrsResponse.success && userAttrsResponse.data) {
        const ids = new Set(userAttrsResponse.data.map(a => a.subjectAttrId!).filter(Boolean));
        setUserRoleIds(ids);
      }
      setRolesLoading(false);

      // Load groups
      setGroupsLoading(true);
      const [allGroupsResponse, userGroupsResponse] = await Promise.all([
        userService.getAllGroups(),
        userService.getGroupsForUser(userId),
      ]);
      if (allGroupsResponse.success && allGroupsResponse.data) {
        setAllGroups(allGroupsResponse.data);
      }
      if (userGroupsResponse.success && userGroupsResponse.data) {
        setUserMemberships(userGroupsResponse.data);
      }
      setGroupsLoading(false);
    };

    loadUserData();
  }, [userId, userService]);

  // Load role attributes for new user too (for the Roles tab checkboxes)
  useEffect(() => {
    if (userId) return; // already loaded above
    const loadRoleAttrs = async () => {
      setRolesLoading(true);
      const response = await userService.getSubjectAttributesByAttributeName('role');
      if (response.success && response.data) {
        setRoleAttributes(response.data);
      }
      setRolesLoading(false);
    };
    loadRoleAttrs();
  }, [userId, userService]);

  // Load all groups for new user too
  useEffect(() => {
    if (userId) return;
    const loadGroups = async () => {
      setGroupsLoading(true);
      const response = await userService.getAllGroups();
      if (response.success && response.data) {
        setAllGroups(response.data);
      }
      setGroupsLoading(false);
    };
    loadGroups();
  }, [userId, userService]);

  const updateField = (field: string, value: string | number) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  // Toggle role assignment
  const handleToggleRole = async (attr: SubjectAttributeDTO) => {
    if (!userId || !attr.subjectAttrId) return;
    const isAssigned = userRoleIds.has(attr.subjectAttrId);

    if (isAssigned) {
      await userService.removeAttributeFromUser(userId, attr.subjectAttrId);
      setUserRoleIds(prev => {
        const next = new Set(prev);
        next.delete(attr.subjectAttrId!);
        return next;
      });
    } else {
      const dto: UserSubjectAttributeDTO = { userId, subjectAttrId: attr.subjectAttrId };
      await userService.assignAttributeToUser(dto);
      setUserRoleIds(prev => new Set(prev).add(attr.subjectAttrId!));
    }
  };

  // Add user to group
  const handleAddToGroup = async (group: UserGroupDTO) => {
    if (!userId || !group.groupId) return;
    const dto: UserGroupMembershipDTO = { userId, groupId: group.groupId };
    const response = await userService.addUserToGroup(dto);
    if (response.success && response.data) {
      setUserMemberships(prev => [...prev, response.data!]);
    }
  };

  // Remove user from group
  const handleRemoveFromGroup = async (membership: UserGroupMembershipDTO) => {
    if (!membership.membershipId) return;
    await userService.removeUserFromGroup(membership.membershipId);
    setUserMemberships(prev => prev.filter(m => m.membershipId !== membership.membershipId));
  };

  // Save handler
  const handleSave = async () => {
    if (!saveAction?.enabled || saving) return;
    setSaving(true);

    try {
      // Save user (main tab)
      await onSave(formData, isNew ? password : undefined);

      // Save profile settings (for existing users)
      if (userId) {
        const settingsToSave: Record<string, string> = { ...settings };
        if (selectedOrgId) {
          settingsToSave.organizationId = selectedOrgId;
        }
        for (const [key, value] of Object.entries(settingsToSave)) {
          if (value) {
            await userService.saveProfileSetting(userId, {
              userId,
              settingKey: key,
              settingValue: value,
            });
          }
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const userGroupIds = new Set(userMemberships.map(m => m.groupId));

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
          {isNew ? 'Add New User' : 'Edit User'}
        </h1>
      </div>

      <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
        <Tabs.Root defaultValue="user">
          <Tabs.List style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', padding: '0 var(--spacing-md)' }}>
            <Tabs.Trigger value="user" style={tabStyle}>User</Tabs.Trigger>
            <Tabs.Trigger value="roles" style={tabStyle}>Roles</Tabs.Trigger>
            <Tabs.Trigger value="settings" style={tabStyle}>Settings</Tabs.Trigger>
            <Tabs.Trigger value="groups" style={tabStyle}>Groups</Tabs.Trigger>
          </Tabs.List>

          <div style={{ padding: 'var(--spacing-lg)' }}>
            {/* User Tab */}
            <Tabs.Content value="user">
              <div style={gridStyle}>
                <InputField fieldKey="userName" value={formData.userName || ''} onChange={v => updateField('userName', v)} />
                <SelectFieldForm
                  label="Status"
                  value={String(formData.userStatus ?? 1)}
                  onChange={v => updateField('userStatus', Number(v))}
                  options={statusOptions.map(o => ({ value: String(o.value), label: o.label }))}
                  required
                />
                <InputField fieldKey="firstName" value={formData.firstName || ''} onChange={v => updateField('firstName', v)} />
                <InputField fieldKey="middleName" value={formData.middleName || ''} onChange={v => updateField('middleName', v)} />
                <InputField fieldKey="lastName" value={formData.lastName || ''} onChange={v => updateField('lastName', v)} />
                <InputField fieldKey="email" value={formData.email || ''} onChange={v => updateField('email', v)} />
                {isNew && (
                  <InputField fieldKey="password" value={password} onChange={setPassword} type="password" />
                )}
                <SelectFieldForm
                  label="Organization"
                  value={selectedOrgId}
                  onChange={setSelectedOrgId}
                  options={organizations.map(o => ({
                    value: String(o.organizationId),
                    label: o.organization,
                  }))}
                />
              </div>
            </Tabs.Content>

            {/* Roles Tab */}
            <Tabs.Content value="roles">
              <div style={{ maxWidth: '400px' }}>
                <h3 style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text)', marginBottom: 'var(--spacing-md)' }}>
                  Assign Roles
                </h3>
                {rolesLoading ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>Loading roles...</p>
                ) : roleAttributes.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>No role attributes found.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                    {roleAttributes.map(attr => {
                      const isAssigned = attr.subjectAttrId ? userRoleIds.has(attr.subjectAttrId) : false;
                      const isDisabled = !userId;
                      return (
                        <label key={attr.subjectAttrId} style={{
                          display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)',
                          padding: 'var(--spacing-md)', backgroundColor: 'var(--color-surface)',
                          borderRadius: 'var(--radius-md)', cursor: isDisabled ? 'not-allowed' : 'pointer',
                          opacity: isDisabled ? 0.6 : 1,
                        }}>
                          <Checkbox.Root
                            checked={isAssigned}
                            onCheckedChange={() => handleToggleRole(attr)}
                            disabled={isDisabled}
                            style={{
                              width: 20, height: 20, backgroundColor: 'var(--color-background)',
                              border: '2px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <Checkbox.Indicator><Check size={14} color="var(--color-primary)" /></Checkbox.Indicator>
                          </Checkbox.Root>
                          <div>
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>
                              {attr.attributeValue}
                            </span>
                            {attr.attributeName && (
                              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginLeft: 'var(--spacing-sm)' }}>
                                ({attr.attributeName})
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
                {!userId && !isNew && (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', marginTop: 'var(--spacing-sm)' }}>
                    Save the user first before assigning roles.
                  </p>
                )}
                {isNew && (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', marginTop: 'var(--spacing-sm)' }}>
                    Save the user first before assigning roles.
                  </p>
                )}
              </div>
            </Tabs.Content>

            {/* Settings Tab */}
            <Tabs.Content value="settings">
              {settingsLoading ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>Loading settings...</p>
              ) : (
                <div style={gridStyle}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                    <label htmlFor="setting-hiringDate" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                      Hiring Date
                    </label>
                    <input
                      id="setting-hiringDate"
                      type="date"
                      value={settings.hiringDate || ''}
                      onChange={e => setSettings(prev => ({ ...prev, hiringDate: e.target.value }))}
                      style={{
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        backgroundColor: 'var(--color-background)',
                        border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-sm)', color: 'var(--color-text)', outline: 'none',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                    <label htmlFor="setting-lastDate" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                      Last Date
                    </label>
                    <input
                      id="setting-lastDate"
                      type="date"
                      value={settings.lastDate || ''}
                      onChange={e => setSettings(prev => ({ ...prev, lastDate: e.target.value }))}
                      style={{
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        backgroundColor: 'var(--color-background)',
                        border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-sm)', color: 'var(--color-text)', outline: 'none',
                      }}
                    />
                  </div>
                  <SelectFieldForm
                    label="Type of Worker"
                    value={settings.workerType || ''}
                    onChange={v => setSettings(prev => ({ ...prev, workerType: v }))}
                    options={workerTypes.map(wt => ({ value: wt, label: wt }))}
                  />
                </div>
              )}
              {isNew && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', marginTop: 'var(--spacing-md)' }}>
                  Settings will be saved after the user is created.
                </p>
              )}
            </Tabs.Content>

            {/* Groups Tab */}
            <Tabs.Content value="groups">
              <div style={{ maxWidth: '600px' }}>
                <h3 style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text)', marginBottom: 'var(--spacing-md)' }}>
                  Group Memberships
                </h3>
                {groupsLoading ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>Loading groups...</p>
                ) : !userId ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                    Save the user first before managing group memberships.
                  </p>
                ) : (
                  <>
                    {/* Current memberships */}
                    {userMemberships.length > 0 && (
                      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                          Current Groups
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                          {userMemberships.map(membership => (
                            <div key={membership.membershipId} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: 'var(--spacing-md)', backgroundColor: 'var(--color-surface)',
                              borderRadius: 'var(--radius-md)',
                            }}>
                              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>
                                {membership.groupName || `Group #${membership.groupId}`}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFromGroup(membership)}
                                style={{
                                  padding: 'var(--spacing-xs) var(--spacing-sm)',
                                  backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)',
                                  border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)',
                                  cursor: 'pointer', fontSize: 'var(--font-size-xs)', fontWeight: 500,
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Available groups to add */}
                    {allGroups.filter(g => !userGroupIds.has(g.groupId!)).length > 0 && (
                      <div>
                        <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                          Available Groups
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                          {allGroups.filter(g => !userGroupIds.has(g.groupId!)).map(group => (
                            <div key={group.groupId} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: 'var(--spacing-md)', backgroundColor: 'var(--color-surface)',
                              borderRadius: 'var(--radius-md)',
                            }}>
                              <div>
                                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>
                                  {group.groupName}
                                </span>
                                {group.description && (
                                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginLeft: 'var(--spacing-sm)' }}>
                                    - {group.description}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAddToGroup(group)}
                                style={{
                                  padding: 'var(--spacing-xs) var(--spacing-sm)',
                                  backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)',
                                  border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-sm)',
                                  cursor: 'pointer', fontSize: 'var(--font-size-xs)', fontWeight: 500,
                                }}
                              >
                                Add
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {allGroups.length === 0 && userMemberships.length === 0 && (
                      <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                        No groups available.
                      </p>
                    )}
                  </>
                )}
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
            <button onClick={handleSave} disabled={!saveAction.enabled || saving} style={{
              padding: 'var(--spacing-sm) var(--spacing-lg)', backgroundColor: 'var(--color-primary)',
              border: 'none', borderRadius: 'var(--radius-md)',
              cursor: (saveAction.enabled && !saving) ? 'pointer' : 'not-allowed',
              fontSize: 'var(--font-size-sm)', color: 'white', fontWeight: 500,
              opacity: (saveAction.enabled && !saving) ? 1 : 0.6,
            }}>{saving ? 'Saving...' : 'Save'}</button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<'directory' | 'form'>('directory');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const userService = useMemo(() => {
    const baseUrl = UserManagementConfigManager.getApiBaseUrl();
    const httpClient = createHttpClient({ baseURL: baseUrl, timeout: 30000 });
    return createUserService(httpClient);
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response: ApiResponse<CustomResponse<User[]>> = await userService.getAllUsers();
      if (response.success && response.data?.response) {
        setUsers(response.data.response);
      } else {
        setError(response.message || 'Failed to load users');
      }
    } catch (err) {
      setError('An unexpected error occurred while loading users');
    } finally {
      setIsLoading(false);
    }
  }, [userService]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setCurrentPage('form');
  };

  const handleAddNew = () => {
    setSelectedUser(null);
    setCurrentPage('form');
  };

  const handleSave = async (userData: Partial<User>, password?: string) => {
    if (selectedUser && selectedUser.userId) {
      // Update existing user
      const response = await userService.updateUser(selectedUser.userId, userData);
      if (response.success) {
        await fetchUsers();
      }
    } else {
      // Register new user
      const response = await userService.register({
        userName: userData.userName || '',
        email: userData.email || '',
        password: password || '',
        firstName: userData.firstName,
        lastName: userData.lastName,
      });
      if (response.success) {
        await fetchUsers();
      }
    }
    setCurrentPage('directory');
    setSelectedUser(null);
  };

  const handleDeleteUser = async (userId: number) => {
    const response = await userService.deleteUser(userId);
    if (response.success) {
      setUsers(prev => prev.filter(u => u.userId !== userId));
    }
  };

  const handleCancel = () => {
    setCurrentPage('directory');
    setSelectedUser(null);
  };

  return (
    <MantineProvider>
      {currentPage === 'directory'
        ? <UserDirectory
            users={users}
            isLoading={isLoading}
            error={error}
            onSelectUser={handleSelectUser}
            onAddNew={handleAddNew}
            onRefresh={fetchUsers}
            onDeleteUser={handleDeleteUser}
          />
        : <UserForm
            user={selectedUser}
            userService={userService}
            onSave={handleSave}
            onCancel={handleCancel}
            isNew={!selectedUser}
          />
      }
    </MantineProvider>
  );
}
