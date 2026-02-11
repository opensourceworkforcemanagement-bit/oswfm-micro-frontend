import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MantineReactTable,
  useMantineReactTable,
  type MRT_ColumnDef,
} from 'mantine-react-table';
import { Box, MantineProvider } from '@mantine/core';
import { IconRefresh, IconPlus, IconArrowLeft, IconEdit, IconTrash } from '@tabler/icons-react';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import 'mantine-react-table/styles.css';

import { PayPeriod } from '../types/timesheet.types.ts';
import {
  PayPeriodService,
  createPayPeriodService,
  CreatePayPeriodRequest,
  UpdatePayPeriodRequest,
} from '../services/pay-period.service.ts';
import { createHttpClient, ApiResponse } from '../services/common.services.ts';
import '../themes/brand-a.css';
import '../index.css';
import { commonClasses, themeClasses, combineClasses } from '../styles/styles.classes.ts';

// ============================================================================
// Configuration Manager
// ============================================================================

class PayPeriodConfigManager {
  static getApiBaseUrl(): string {
    if (typeof window !== 'undefined' && (window as any).VITE_API_BASE_URL) {
      return (window as any).VITE_API_BASE_URL;
    }
    return 'http://localhost:1110/api/v1';
  }

  static getPayPeriodTypeLabel(typeId: number): string {
    return PayPeriodService.getPayPeriodTypeLabel(typeId);
  }

  static getPayPeriodTypeOptions(): { value: number; label: string }[] {
    return PayPeriodService.getPayPeriodTypeOptions();
  }

  static getFields(): Record<string, {
    enabled: boolean;
    readonly: boolean;
    visible: boolean;
    label: string;
    hint: string;
    required: boolean;
  }> {
    return {
      payPeriodTypeId: { enabled: true, readonly: false, visible: true, label: 'Pay Period Type', hint: 'Select the type of pay period', required: true },
      startDate: { enabled: true, readonly: false, visible: true, label: 'Start Date', hint: 'Pay period start date', required: true },
      endDate: { enabled: true, readonly: false, visible: true, label: 'End Date', hint: 'Pay period end date', required: true },
      year: { enabled: true, readonly: false, visible: true, label: 'Year', hint: 'e.g., 2026', required: true },
      periodNumber: { enabled: true, readonly: false, visible: true, label: 'Period Number', hint: 'Sequential period number', required: true },
    };
  }

  static getFieldConfig(key: string) {
    return this.getFields()[key];
  }

  static getActions(): Record<string, { enabled: boolean; visible: boolean }> {
    return {
      add: { enabled: true, visible: true },
      edit: { enabled: true, visible: true },
      delete: { enabled: true, visible: true },
      save: { enabled: true, visible: true },
      cancel: { enabled: true, visible: true },
    };
  }

  static getActionConfig(key: string) {
    return this.getActions()[key];
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

const InputField = ({ fieldKey, value, onChange, type = 'text' }: {
  fieldKey: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) => {
  const fieldConfig = PayPeriodConfigManager.getFieldConfig(fieldKey);
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
  const fieldConfig = PayPeriodConfigManager.getFieldConfig(fieldKey);
  if (!fieldConfig?.visible) return null;
  const isDisabled = !fieldConfig.enabled || fieldConfig.readonly;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
      <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
        {fieldConfig.label}{fieldConfig.required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
      </label>
      <Select.Root value={value} onValueChange={onChange} disabled={isDisabled}>
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
// Pay Period Directory (Table View)
// ============================================================================

const PayPeriodDirectory = ({ payPeriods, isLoading, error, onSelectPayPeriod, onAddNew, onRefresh, onDelete }: {
  payPeriods: PayPeriod[];
  isLoading: boolean;
  error: string | null;
  onSelectPayPeriod: (pp: PayPeriod) => void;
  onAddNew: () => void;
  onRefresh: () => void;
  onDelete: (id: number) => void;
}) => {
  const addAction = PayPeriodConfigManager.getActionConfig('add');
  const editAction = PayPeriodConfigManager.getActionConfig('edit');
  const deleteAction = PayPeriodConfigManager.getActionConfig('delete');

  const columns = useMemo<MRT_ColumnDef<PayPeriod>[]>(() => {
    const cols: MRT_ColumnDef<PayPeriod>[] = [
      {
        accessorKey: 'payPeriodId',
        header: 'ID',
        size: 80,
        enableColumnFilter: false,
      },
      {
        accessorKey: 'payPeriodTypeId',
        header: 'Pay Period Type',
        size: 160,
        Cell: ({ cell }) => {
          const typeId = cell.getValue<number>();
          return <span>{PayPeriodConfigManager.getPayPeriodTypeLabel(typeId)}</span>;
        },
        filterVariant: 'select',
        mantineFilterSelectProps: {
          data: PayPeriodConfigManager.getPayPeriodTypeOptions().map(o => ({
            value: String(o.value),
            label: o.label,
          })),
        },
      },
      {
        accessorKey: 'startDate',
        header: 'Start Date',
        size: 140,
        Cell: ({ cell }) => {
          const val = cell.getValue<string | Date>();
          return <span>{new Date(val).toLocaleDateString()}</span>;
        },
      },
      {
        accessorKey: 'endDate',
        header: 'End Date',
        size: 140,
        Cell: ({ cell }) => {
          const val = cell.getValue<string | Date>();
          return <span>{new Date(val).toLocaleDateString()}</span>;
        },
      },
      {
        accessorKey: 'year',
        header: 'Year',
        size: 100,
      },
      {
        accessorKey: 'periodNumber',
        header: 'Period Number',
        size: 130,
      },
    ];

    const actionButtons: MRT_ColumnDef<PayPeriod> = {
      id: 'actions',
      header: 'Actions',
      size: 160,
      enableColumnFilter: false,
      enableSorting: false,
      Cell: ({ row }) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          {editAction?.visible && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectPayPeriod(row.original);
              }}
              disabled={!editAction.enabled}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                padding: 'var(--spacing-xs) var(--spacing-sm)', backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)', border: '1px solid var(--color-primary)',
                borderRadius: 'var(--radius-sm)', cursor: editAction.enabled ? 'pointer' : 'not-allowed',
                fontSize: 'var(--font-size-xs)', fontWeight: 500, gap: 'var(--spacing-xs)',
                opacity: editAction.enabled ? 1 : 0.6,
                transition: 'var(--transition-fast)',
              }}
            >
              <IconEdit size={14} /> Edit
            </button>
          )}
          {deleteAction?.visible && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this pay period?')) {
                  onDelete(row.original.payPeriodId);
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
    };

    if ((editAction?.visible && editAction?.enabled) || (deleteAction?.visible && deleteAction?.enabled)) {
      cols.push(actionButtons);
    }

    return cols;
  }, [editAction, deleteAction, onSelectPayPeriod, onDelete]);

  const table = useMantineReactTable({
    columns,
    data: payPeriods,
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
      sorting: [{ id: 'year', desc: true }],
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
      onClick: editAction?.enabled ? () => onSelectPayPeriod(row.original) : undefined,
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
            <IconPlus size={16} /> Add Pay Period
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
          Pay Period Directory
        </h1>
      </div>

      <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <MantineReactTable table={table} />
      </div>
    </div>
  );
};

// ============================================================================
// Pay Period Form (Add/Edit View)
// ============================================================================

interface PayPeriodFormState {
  payPeriodTypeId: number;
  startDate: string;
  endDate: string;
  year: number;
  periodNumber: number;
}

const createInitialFormState = (payPeriod: PayPeriod | null): PayPeriodFormState => {
  if (payPeriod) {
    return {
      payPeriodTypeId: payPeriod.payPeriodTypeId,
      startDate: PayPeriodService.formatDateForInput(payPeriod.startDate),
      endDate: PayPeriodService.formatDateForInput(payPeriod.endDate),
      year: payPeriod.year,
      periodNumber: payPeriod.periodNumber,
    };
  }
  return {
    payPeriodTypeId: 1,
    startDate: '',
    endDate: '',
    year: new Date().getFullYear(),
    periodNumber: 1,
  };
};

const PayPeriodForm = ({ payPeriod, onSave, onCancel, isNew }: {
  payPeriod: PayPeriod | null;
  onSave: (data: CreatePayPeriodRequest | UpdatePayPeriodRequest) => void;
  onCancel: () => void;
  isNew: boolean;
}) => {
  const [formState, setFormState] = useState<PayPeriodFormState>(() => createInitialFormState(payPeriod));
  const [validationError, setValidationError] = useState<string | null>(null);

  const saveAction = PayPeriodConfigManager.getActionConfig('save');
  const cancelAction = PayPeriodConfigManager.getActionConfig('cancel');

  const payPeriodTypeOptions = PayPeriodConfigManager.getPayPeriodTypeOptions().map(o => ({
    value: String(o.value),
    label: o.label,
  }));

  const updateField = (field: keyof PayPeriodFormState, value: string | number) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!saveAction?.enabled) return;
    setValidationError(null);

    if (!formState.startDate) {
      setValidationError('Start Date is required.');
      return;
    }
    if (!formState.endDate) {
      setValidationError('End Date is required.');
      return;
    }
    if (new Date(formState.endDate) <= new Date(formState.startDate)) {
      setValidationError('End Date must be after Start Date.');
      return;
    }
    if (!formState.year || formState.year < 1900) {
      setValidationError('Please enter a valid year.');
      return;
    }
    if (!formState.periodNumber || formState.periodNumber < 1) {
      setValidationError('Period Number must be at least 1.');
      return;
    }

    const data: CreatePayPeriodRequest = {
      payPeriodTypeId: formState.payPeriodTypeId,
      startDate: formState.startDate,
      endDate: formState.endDate,
      year: formState.year,
      periodNumber: formState.periodNumber,
    };

    onSave(data);
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
          {isNew ? 'Add New Pay Period' : 'Edit Pay Period'}
        </h1>
      </div>

      <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ padding: 'var(--spacing-lg)' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', maxWidth: '600px',
          }}>
            <SelectField
              fieldKey="payPeriodTypeId"
              value={String(formState.payPeriodTypeId)}
              onChange={v => updateField('payPeriodTypeId', Number(v))}
              options={payPeriodTypeOptions}
            />
            <InputField
              fieldKey="year"
              value={String(formState.year)}
              onChange={v => updateField('year', Number(v))}
              type="number"
            />
            <InputField
              fieldKey="startDate"
              value={formState.startDate}
              onChange={v => updateField('startDate', v)}
              type="date"
            />
            <InputField
              fieldKey="endDate"
              value={formState.endDate}
              onChange={v => updateField('endDate', v)}
              type="date"
            />
            <InputField
              fieldKey="periodNumber"
              value={String(formState.periodNumber)}
              onChange={v => updateField('periodNumber', Number(v))}
              type="number"
            />
          </div>

          {validationError && (
            <div style={{ marginTop: 'var(--spacing-md)', color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)' }}>
              {validationError}
            </div>
          )}
        </div>

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

export default function PayPeriodManagement() {
  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<'directory' | 'form'>('directory');
  const [selectedPayPeriod, setSelectedPayPeriod] = useState<PayPeriod | null>(null);

  const payPeriodService = useMemo(() => {
    const baseUrl = PayPeriodConfigManager.getApiBaseUrl();
    const httpClient = createHttpClient({ baseURL: baseUrl, timeout: 30000 });
    return createPayPeriodService(httpClient);
  }, []);

  const fetchPayPeriods = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response: ApiResponse<PayPeriod[]> = await payPeriodService.getAllPayPeriods();
      if (response.success && response.data) {
        setPayPeriods(response.data);
      } else {
        setError(response.message || 'Failed to load pay periods');
      }
    } catch (err) {
      setError('An unexpected error occurred while loading pay periods');
    } finally {
      setIsLoading(false);
    }
  }, [payPeriodService]);

  useEffect(() => {
    fetchPayPeriods();
  }, [fetchPayPeriods]);

  const handleSelectPayPeriod = (pp: PayPeriod) => {
    setSelectedPayPeriod(pp);
    setCurrentPage('form');
  };

  const handleAddNew = () => {
    setSelectedPayPeriod(null);
    setCurrentPage('form');
  };

  const handleSave = async (data: CreatePayPeriodRequest | UpdatePayPeriodRequest) => {
    try {
      if (selectedPayPeriod) {
        const response = await payPeriodService.updatePayPeriod(selectedPayPeriod.payPeriodId, data as UpdatePayPeriodRequest);
        if (response.success && response.data) {
          setPayPeriods(payPeriods.map(pp =>
            pp.payPeriodId === selectedPayPeriod.payPeriodId ? response.data! : pp
          ));
        } else {
          setError(response.message || 'Failed to update pay period');
          return;
        }
      } else {
        const response = await payPeriodService.createPayPeriod(data as CreatePayPeriodRequest);
        if (response.success && response.data) {
          setPayPeriods([...payPeriods, response.data]);
        } else {
          setError(response.message || 'Failed to create pay period');
          return;
        }
      }
      setCurrentPage('directory');
      setSelectedPayPeriod(null);
    } catch (err) {
      setError('An unexpected error occurred while saving');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await payPeriodService.deletePayPeriod(id);
      if (response.success) {
        setPayPeriods(payPeriods.filter(pp => pp.payPeriodId !== id));
      } else {
        setError(response.message || 'Failed to delete pay period');
      }
    } catch (err) {
      setError('An unexpected error occurred while deleting');
    }
  };

  const handleCancel = () => {
    setCurrentPage('directory');
    setSelectedPayPeriod(null);
  };

  return (
    <MantineProvider>
      {currentPage === 'directory'
        ? <PayPeriodDirectory
            payPeriods={payPeriods}
            isLoading={isLoading}
            error={error}
            onSelectPayPeriod={handleSelectPayPeriod}
            onAddNew={handleAddNew}
            onRefresh={fetchPayPeriods}
            onDelete={handleDelete}
          />
        : <PayPeriodForm
            payPeriod={selectedPayPeriod}
            onSave={handleSave}
            onCancel={handleCancel}
            isNew={!selectedPayPeriod}
          />
      }
    </MantineProvider>
  );
}
