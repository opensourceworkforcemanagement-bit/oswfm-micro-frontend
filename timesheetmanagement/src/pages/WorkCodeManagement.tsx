// src/components/WorkCodeManagement/WorkCodeManagement.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MantineReactTable,
  useMantineReactTable,
  type MRT_ColumnDef,
} from 'mantine-react-table';
import { Box, MantineProvider } from '@mantine/core';
import * as Tabs from '@radix-ui/react-tabs';
import * as Select from '@radix-ui/react-select';
import * as Label from '@radix-ui/react-label';
import { Flex, Text, Button } from "@radix-ui/themes";
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { ArrowLeft, Plus, Pencil, Trash2, ChevronDown, Loader2, Check, AlertCircle, RefreshCw } from 'lucide-react';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import 'mantine-react-table/styles.css';
import '../themes/brand-a.css';
import '../index.css';

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Import centralized styles
import { commonClasses, themeClasses, combineClasses } from '../styles/styles.classes.ts';

// Import services
import { WorkCodeService } from '../services/work-codes.service.ts';
import { HttpClient } from '../services/common.services.ts';

// Import types
import { WorkforceCode, WorkCodePageConfig } from '../types/workcode.types.ts';

// Import configuration
import { WorkCodeConfigManager } from '../config/workcode.config.ts';

// Initialize service
const httpClient = new HttpClient({ baseURL: 'http://localhost:1110/api/v1' });
const workCodeService = new WorkCodeService(httpClient);

interface WorkCodeManagementProps {
  pageConfig?: WorkCodePageConfig;
  theme?: 'brand-a' | 'brand-a-dark';
}

// WorkCodeList Component (Directory View)
const WorkCodeList: React.FC<{
  workCodes: WorkforceCode[];
  isLoading: boolean;
  onSelectWorkCode: (workCode: WorkforceCode) => void;
  onAddNew: () => void;
  onRefresh: () => void;
  onDelete: (id: number) => void;
  pageConfig: WorkCodePageConfig;
  theme?: string;
}> = ({ workCodes, isLoading, onSelectWorkCode, onAddNew, onRefresh, onDelete, pageConfig, theme }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const addActionConfig = pageConfig.actions.add;
  const editActionConfig = pageConfig.actions.edit;
  const deleteActionConfig = pageConfig.actions.delete;

  const openDeleteDialog = (id: number) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    setIsDeleting(true);
    try {
      await onDelete(deletingId);
      setDeleteDialogOpen(false);
      setDeletingId(null);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const visibleColumns = useMemo(() => {
    return Object.entries(pageConfig.columns)
      .filter(([_, config]) => config.visible)
      .map(([key, config]) => ({ key, ...config }));
  }, [pageConfig.columns]);

  const hasVisibleActions = useMemo(() => {
    return editActionConfig.visible || deleteActionConfig.visible;
  }, [editActionConfig, deleteActionConfig]);

  const columns = useMemo<MRT_ColumnDef<WorkforceCode>[]>(() => {
    const cols: MRT_ColumnDef<WorkforceCode>[] = visibleColumns.map(col => {
      const colDef: MRT_ColumnDef<WorkforceCode> = {
        accessorKey: col.key as keyof WorkforceCode,
        header: col.label,
        size: 150,
      };

      if (col.key === 'status') {
        colDef.Cell = ({ cell }) => {
          const value = cell.getValue<number>();
          const statusClass = WorkCodeService.getStatusColor(value as any);
          return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClass}`}>
              {WorkCodeService.getStatusLabel(value as any)}
            </span>
          );
        };
        colDef.filterVariant = 'select';
        colDef.mantineFilterSelectProps = {
          data: WorkCodeService.getStatusOptions().map(o => ({
            value: String(o.value),
            label: o.label,
          })),
        };
      }

      if (col.key === 'effectiveDate' || col.key === 'expirationDate') {
        colDef.Cell = ({ cell }) => {
          const value = cell.getValue<Date | string>();
          if (!value) return '-';
          return new Date(value).toLocaleDateString();
        };
      }

      return colDef;
    });

    if (hasVisibleActions) {
      cols.push({
        id: 'actions',
        header: 'Actions',
        size: 150,
        enableColumnFilter: false,
        enableSorting: false,
        Cell: ({ row }) => (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {editActionConfig.visible && editActionConfig.enabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectWorkCode(row.original);
                }}
                className={combineClasses(commonClasses.primaryButton)}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                <Pencil size={14} /> Edit
              </button>
            )}
            {deleteActionConfig.visible && deleteActionConfig.enabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openDeleteDialog(row.original.id);
                }}
                className={combineClasses(commonClasses.dangerButton)}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
        ),
      });
    }

    return cols;
  }, [visibleColumns, hasVisibleActions, editActionConfig, deleteActionConfig, onSelectWorkCode]);

  const table = useMantineReactTable({
    columns,
    data: workCodes,
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
      sorting: [{ id: 'shortCodeValue', desc: false }],
    },
    paginationDisplayMode: 'pages',
    state: {
      isLoading,
    },
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
      onClick: editActionConfig?.enabled ? () => onSelectWorkCode(row.original) : undefined,
      style: { cursor: editActionConfig?.enabled ? 'pointer' : 'default' },
    }),
    renderTopToolbarCustomActions: () => (
      <Box style={{ display: 'flex', gap: '16px', padding: '8px' }}>
        {addActionConfig.visible && (
          <Button
            onClick={onAddNew}
            disabled={!addActionConfig.enabled}
            className={combineClasses(
              commonClasses.primaryButton,
              addActionConfig.enabled && themeClasses.primary,
              addActionConfig.enabled && themeClasses.primaryHover
            )}
            style={{
              cursor: addActionConfig.enabled ? 'pointer' : 'not-allowed',
              opacity: addActionConfig.enabled ? 1 : 0.6,
              backgroundColor: !addActionConfig.enabled ? '#9ca3af' : undefined
            }}
          >
            <Plus size={16} />
            Add Work Code
          </Button>
        )}
        <Button
          onClick={onRefresh}
          className={combineClasses(
            commonClasses.secondaryButton,
            themeClasses.background,
            themeClasses.border,
            themeClasses.textPrimary
          )}
          style={{ cursor: 'pointer' }}
        >
          <RefreshCw size={16} />
          Refresh
        </Button>
      </Box>
    ),
  });

  return (
    <div data-theme={theme} className={combineClasses(commonClasses.workCodePage, themeClasses.background)}>
      <div className={commonClasses.workCodePageInner}>
        {/* Header */}
        <div className={commonClasses.workCodeHeader}>
          <h1 className={combineClasses(commonClasses.pageTitle, themeClasses.textPrimary)}>
            Work Code Directory
          </h1>
        </div>

        {/* Table */}
        <div className={combineClasses(
          commonClasses.workCodeTableWrapper,
          themeClasses.background,
          themeClasses.border
        )}>
          <MantineReactTable table={table} />
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialog.Portal>
            <AlertDialog.Overlay className={commonClasses.dialogOverlay} />
            <AlertDialog.Content className={combineClasses(
              commonClasses.dialogContent,
              themeClasses.surface
            )}>
              <AlertDialog.Title className={combineClasses(
                commonClasses.dialogTitle,
                themeClasses.textPrimary
              )}>
                Delete Work Code
              </AlertDialog.Title>
              <AlertDialog.Description className={combineClasses(
                commonClasses.dialogDescription,
                themeClasses.textSecondary
              )}>
                Are you sure you want to delete this work code? This action cannot be undone.
              </AlertDialog.Description>
              <div className="flex justify-end gap-3">
                <AlertDialog.Cancel asChild>
                  <Button
                    disabled={isDeleting}
                    className={combineClasses(
                      commonClasses.secondaryButton,
                      themeClasses.textPrimary
                    )}
                    style={{
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      opacity: isDeleting ? 0.6 : 1
                    }}
                  >
                    Cancel
                  </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <Button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className={combineClasses(commonClasses.dangerButton, 'flex items-center gap-2')}
                    style={{
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      opacity: isDeleting ? 0.6 : 1
                    }}
                  >
                    {isDeleting && <Loader2 className="animate-spin" size={16} />}
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      </div>
    </div>
  );
};

// WorkCodeForm Component (Add/Edit View)
const WorkCodeForm: React.FC<{
  workCode: WorkforceCode | null;
  onSave: (data: Omit<WorkforceCode, 'id'>) => Promise<void>;
  onCancel: () => void;
  isNew: boolean;
  pageConfig: WorkCodePageConfig;
  theme?: string;
}> = ({ workCode, onSave, onCancel, isNew, pageConfig, theme }) => {
  const [formData, setFormData] = useState<Omit<WorkforceCode, 'id'>>(
    workCode || {
      codeId: 0,
      codeTypeId: 0,
      prefix: '',
      suffix: '',
      shortCodeValue: '',
      longCodeValue: '',
      description: '',
      status: 1,
      effectiveDate: new Date(),
      expirationDate: new Date()
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveAction = pageConfig.actions.add;
  const cancelAction = { enabled: true, visible: true };

  const updateField = (field: string, value: string | number | Date) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!saveAction?.enabled) return;

    // Validate using service
    const validationError = WorkCodeService.validateWorkCode(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    //TODO: display all errors instead of just the first one
    const requiredFields = Object.entries(pageConfig.fields)
      .filter(([_, config]) => config.required && config.visible);

    const missingFields: string[] = [];
    for (const field of requiredFields) {
      if (!formData[field[0]]) {
        missingFields.push(field[1].label);
      }
    }
    if (missingFields.length > 0) {
      setError(`Required fields missing: ${missingFields.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to save work code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldConfig = (fieldName: string) => {
    return pageConfig.fields[fieldName] || {
      enabled: true,
      readonly: false,
      visible: true,
      label: fieldName,
      hint: '',
      required: false
    };
  };

  const renderFieldInput = (fieldName: string) => {
    const fieldConfig = getFieldConfig(fieldName);
    
    if (!fieldConfig.visible) return null;

    const isDisabled = !fieldConfig.enabled || fieldConfig.readonly;
    const inputId = `field-${fieldName}`;

    if (fieldName === 'status') {
      return (
        <div key={fieldName} className={commonClasses.workCodeFieldWrapper}>
          <Label.Root 
            htmlFor={inputId} 
            className={combineClasses(commonClasses.workCodeFieldLabel, themeClasses.textSecondary)}
          >
            {fieldConfig.label} 
            {fieldConfig.required && <span className="text-red-600">*</span>}
          </Label.Root>
          <Select.Root 
            value={formData.status.toString()} 
            onValueChange={(value) => updateField('status', parseInt(value))}
            disabled={isDisabled}
          >
            <Select.Trigger 
              id={inputId}
              className={combineClasses(
                commonClasses.workCodeSelectTrigger,
                isDisabled ? themeClasses.surface : themeClasses.background,
                themeClasses.border,
                themeClasses.textPrimary
              )}
              disabled={isDisabled}
              style={{
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.6 : 1
              }}
            >
              <Select.Value />
              <Select.Icon>
                <ChevronDown size={16} />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content 
                className={combineClasses(
                  commonClasses.workCodeSelectContent,
                  themeClasses.selectBackground,
                  themeClasses.border
                )}
              >
                <Select.Viewport className="p-1">
                  {WorkCodeService.getStatusOptions().map(option => (
                    <Select.Item 
                      key={option.value} 
                      value={option.value.toString()}
                      className={combineClasses(
                        commonClasses.workCodeSelectItem,
                        themeClasses.textPrimary
                      )}
                    >
                      <Select.ItemText>{option.label}</Select.ItemText>
                      <Select.ItemIndicator className="ml-auto">
                        <Check size={16} />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
          {fieldConfig.hint && (
            <span className={combineClasses('text-xs', themeClasses.textMuted)}>
              {fieldConfig.hint}
            </span>
          )}
        </div>
      );
    }

    if (fieldName === 'description') {
      return (
        <div key={fieldName} className={commonClasses.workCodeFieldWrapper}>
          <Label.Root 
            htmlFor={inputId} 
            className={combineClasses(commonClasses.workCodeFieldLabel, themeClasses.textSecondary)}
          >
            {fieldConfig.label} 
            {fieldConfig.required && <span className="text-red-600">*</span>}
          </Label.Root>
          <textarea
            id={inputId}
            value={formData[fieldName] || ''}
            onChange={(e) => updateField(fieldName, e.target.value)}
            disabled={isDisabled}
            placeholder={fieldConfig.hint}
            className={combineClasses(
              commonClasses.workCodeFieldTextarea,
              isDisabled ? themeClasses.surface : themeClasses.background,
              themeClasses.border,
              themeClasses.textPrimary
            )}
            style={{
              cursor: isDisabled ? 'not-allowed' : 'text',
              opacity: isDisabled ? 0.6 : 1
            }}
          />
          {fieldConfig.hint && (
            <span className={combineClasses('text-xs', themeClasses.textMuted)}>
              {fieldConfig.hint}
            </span>
          )}
        </div>
      );
    }

    if (fieldConfig.type === 'date') {
        return (
              <div key={fieldName} className={commonClasses.workCodeFieldWrapper}>
                <Label.Root 
                  htmlFor={inputId} 
                  className={combineClasses(commonClasses.workCodeFieldLabel, themeClasses.textSecondary)}
                >
                  {fieldConfig.label} 
                  {fieldConfig.required && <span className="text-red-600">*</span>}
                </Label.Root>
                <DatePicker selected={formData[fieldName as keyof typeof formData] ? new Date(formData[fieldName as keyof typeof formData]) : ''} onChange={
                  (date) =>  updateField(fieldName, date)
                
                } 
                className={combineClasses(
                    commonClasses.workCodeFieldInput,
                    isDisabled ? themeClasses.surface : themeClasses.background,
                    themeClasses.border,
                    themeClasses.textPrimary
                  )}
                  style={{
                    cursor: isDisabled ? 'not-allowed' : 'text',
                    opacity: isDisabled ? 0.6 : 1
                  }}
                />
              </div>
        );
    }

    return (
      <div key={fieldName} className={commonClasses.workCodeFieldWrapper}>
        <Label.Root 
          htmlFor={inputId} 
          className={combineClasses(commonClasses.workCodeFieldLabel, themeClasses.textSecondary)}
        >
          {fieldConfig.label} 
          {fieldConfig.required && <span className="text-red-600">*</span>}
        </Label.Root>
        <input
          id={inputId}
          type="text"
          value={formData[fieldName as keyof typeof formData] || ''}
          onChange={(e) => updateField(fieldName, e.target.value)}
          disabled={isDisabled}
          placeholder={fieldConfig.hint}
          className={combineClasses(
            commonClasses.workCodeFieldInput,
            isDisabled ? themeClasses.surface : themeClasses.background,
            themeClasses.border,
            themeClasses.textPrimary
          )}
          style={{
            cursor: isDisabled ? 'not-allowed' : 'text',
            opacity: isDisabled ? 0.6 : 1
          }}
        />
        {fieldConfig.hint && (
          <span className={combineClasses('text-xs', themeClasses.textMuted)}>
            {fieldConfig.hint}
          </span>
        )}
      </div>
    );
  };

  return (
    <div data-theme={theme} className={combineClasses(commonClasses.workCodePage, themeClasses.background)}>
      <div className={commonClasses.workCodePageInner}>
        {/* Header */}
        <div className={commonClasses.workCodeFormHeader}>
          <Button
            onClick={onCancel}
            className={combineClasses(commonClasses.workCodeBackButton, themeClasses.textPrimary)}
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </Button>
          <h1 className={combineClasses(commonClasses.workCodeFormTitle, themeClasses.textPrimary)}>
            {isNew ? 'Add New Work Code' : 'Edit Work Code'}
          </h1>
        </div>

        {/* Error Alert */}
         {/* //TODO: display all errors instead of just the first one */}
        {error && (
          <div className={combineClasses(
            commonClasses.workCodeErrorAlert,
            'bg-red-50 border-red-200'
          )}>
            <AlertCircle className={combineClasses(commonClasses.workCodeErrorIcon, 'text-red-600')} size={20} />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Form */}
        <div className={combineClasses(
          commonClasses.workCodeFormContainer,
          themeClasses.background
        )}>
          <Tabs.Root defaultValue="general">
            <Tabs.List className={combineClasses(
              commonClasses.workCodeTabList,
              themeClasses.surface
            )}>
              <Tabs.Trigger 
                value="general" 
                className={combineClasses(
                  commonClasses.workCodeTab,
                  themeClasses.textPrimary
                )}
                data-state="active"
              >
                General
              </Tabs.Trigger>
              <Tabs.Trigger 
                value="details" 
                className={combineClasses(
                  commonClasses.workCodeTab,
                  themeClasses.textPrimary
                )}
              >
                Details
              </Tabs.Trigger>
            </Tabs.List>

            <div className={commonClasses.workCodeTabContent}>
              <Tabs.Content value="general">
                <div className={commonClasses.workCodeFormGrid}>

                 
                  {(() => {
                    const elements = [];
                    for (const [key, config] of Object.entries(pageConfig.fields)) {
                      if (config.visible && config.tab[0] == 'general') {
                        elements.push(renderFieldInput(key));
                      }
                    }
                    return elements;
                  })()}

                </div>
              </Tabs.Content>

              <Tabs.Content value="details">
                <div className={commonClasses.workCodeFormSingle}>
                  {renderFieldInput('description')}
                </div>
              </Tabs.Content>
            </div>
          </Tabs.Root>

          {/* Footer Actions */}
          <div className={combineClasses(
            commonClasses.workCodeFormFooter,
            themeClasses.surface
          )}>
            {cancelAction?.visible && (
              <Button
                onClick={onCancel}
                disabled={!cancelAction.enabled || isSubmitting}
                className={combineClasses(
                  commonClasses.workCodeCancelButton,
                  themeClasses.background,
                  themeClasses.border,
                  themeClasses.textPrimary
                )}
                style={{
                  cursor: (cancelAction.enabled && !isSubmitting) ? 'pointer' : 'not-allowed',
                  opacity: (cancelAction.enabled && !isSubmitting) ? 1 : 0.6
                }}
              >
                Cancel
              </Button>
            )}
            {saveAction?.visible && (
              <Button
                onClick={handleSave}
                disabled={!saveAction.enabled || isSubmitting}
                className={combineClasses(
                  commonClasses.workCodeSaveButton,
                  (saveAction.enabled && !isSubmitting) && themeClasses.primary,
                  (saveAction.enabled && !isSubmitting) && themeClasses.primaryHover
                )}
                style={{
                  cursor: (saveAction.enabled && !isSubmitting) ? 'pointer' : 'not-allowed',
                  opacity: (saveAction.enabled && !isSubmitting) ? 1 : 0.6,
                  backgroundColor: (!saveAction.enabled || isSubmitting) ? '#9ca3af' : undefined
                }}
              >
                {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main WorkCodeManagement Component (Container)
const WorkCodeManagement: React.FC<WorkCodeManagementProps> = ({ 
  pageConfig = WorkCodeConfigManager.getDefaultPageConfig(),
  theme = 'brand-a'
}) => {
  const [workCodes, setWorkCodes] = useState<WorkforceCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<'list' | 'form'>('list');
  const [selectedWorkCode, setSelectedWorkCode] = useState<WorkforceCode | null>(null);
  useEffect(() => {
    fetchWorkCodes();
  }, []);

  const fetchWorkCodes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await workCodeService.getAllWorkCodes();
      
      if (response.success && response.data) {
        setWorkCodes(response.data);
      } else {
        setError(response.message || 'Failed to fetch work codes');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Error fetching work codes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectWorkCode = (workCode: WorkforceCode) => {
    setSelectedWorkCode(workCode);
    setCurrentPage('form');
  };

  const handleAddNew = () => {
    setSelectedWorkCode(null);
    setCurrentPage('form');
  };

  const handleSave = async (data: Omit<WorkforceCode, 'id'>) => {
    try {
      if (selectedWorkCode) {
        // Update existing
        const response = await workCodeService.updateWorkCode(selectedWorkCode.id, data);

        if (response.success && response.data) {
          setWorkCodes(prev => prev.map(wc =>
            wc.id === selectedWorkCode.id ? response.data! : wc
          ));
        } else {
          throw new Error(response.message || 'Update failed');
        }
      } else {
        // Create new
        const response = await workCodeService.createWorkCode(data);
        
        if (response.success && response.data) {
          setWorkCodes(prev => [...prev, response.data!]);
        } else {
          throw new Error(response.message || 'Create failed');
        }
      }
      
      setCurrentPage('list');
      setSelectedWorkCode(null);
    } catch (err) {
      throw err; // Let the form handle the error display
    }
  };

  const handleCancel = () => {
    setCurrentPage('list');
    setSelectedWorkCode(null);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await workCodeService.deleteWorkCode(id);
      
      if (response.success) {
        setWorkCodes(prev => prev.filter(wc => wc.id !== id));
      } else {
        throw new Error(response.message || 'Delete failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Error deleting work code:', err);
      alert(`Failed to delete work code: ${message}`);
      throw err;
    }
  };

  return (
    <MantineProvider>
      {currentPage === 'list' ? (
        <WorkCodeList
          workCodes={workCodes}
          isLoading={isLoading}
          onSelectWorkCode={handleSelectWorkCode}
          onAddNew={handleAddNew}
          onRefresh={fetchWorkCodes}
          onDelete={handleDelete}
          pageConfig={pageConfig}
          theme={theme}
        />
      ) : (
        <WorkCodeForm
          workCode={selectedWorkCode}
          onSave={handleSave}
          onCancel={handleCancel}
          isNew={!selectedWorkCode}
          pageConfig={pageConfig}
          theme={theme}
        />
      )}
    </MantineProvider>
  );
};

export default WorkCodeManagement;
