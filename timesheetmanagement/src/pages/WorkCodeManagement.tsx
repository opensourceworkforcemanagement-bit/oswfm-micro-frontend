// src/components/WorkCodeManagement/WorkCodeManagement.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Select from '@radix-ui/react-select';
import * as Label from '@radix-ui/react-label';
import { Flex, Text, Button } from "@radix-ui/themes";
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { ArrowLeft, Plus, Pencil, Trash2, ChevronDown, Loader2, Search, Check, AlertCircle } from 'lucide-react';
import { ReactTabulator } from 'react-tabulator';
import 'react-tabulator/css/tabulator.min.css';
import 'react-tabulator/css/bootstrap/tabulator_bootstrap.min.css';
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
  onDelete: (id: number) => void;
  pageConfig: WorkCodePageConfig;
  theme?: string;
}> = ({ workCodes, isLoading, onSelectWorkCode, onAddNew, onDelete, pageConfig, theme }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const addActionConfig = pageConfig.actions.add;
  const editActionConfig = pageConfig.actions.edit;
  const deleteActionConfig = pageConfig.actions.delete;

  const visibleColumns = useMemo(() => {
    return Object.entries(pageConfig.columns)
      .filter(([_, config]) => config.visible)
      .map(([key, config]) => ({ key, ...config }));
  }, [pageConfig.columns]);

  const visibleFieldNames = useMemo(() => {
    return Object.entries(pageConfig.fields)
      .filter(([_, config]) => config.visible)
      .map(([key, _]) => key);
  }, [pageConfig.fields]);

  const filteredWorkCodes = useMemo(() => {
    if (!searchQuery.trim()) return workCodes;

    const query = searchQuery.toLowerCase();
    
    return workCodes.filter(code => {
      return visibleFieldNames.some(fieldName => {
        const value = code[fieldName as keyof WorkforceCode];
        if (value === null || value === undefined) return false;

        if (fieldName === 'status') {
          return WorkCodeService.getStatusLabel(value as number).toLowerCase().includes(query);
        }
        return String(value).toLowerCase().includes(query);
      });
    });
  }, [workCodes, searchQuery, visibleFieldNames]);

  const hasVisibleActions = useMemo(() => {
    return editActionConfig.visible || deleteActionConfig.visible;
  }, [editActionConfig, deleteActionConfig]);

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

  const handleSearchChange = (value: string) => {
    setSearchQuery(value.substring(0, 100));
  };

  return (
    <div data-theme={theme} className={combineClasses(commonClasses.workCodePage, themeClasses.background)}>
      <div className={commonClasses.workCodePageInner}>
        {/* Header */}
        <div className={commonClasses.workCodeHeader}>
          <h1 className={combineClasses(commonClasses.pageTitle, themeClasses.textPrimary)}>
            Work Code Directory
          </h1>
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
        </div>

        {/* Search */}
        <div className={commonClasses.workCodeSearchWrapper}>
          <Label.Root 
            htmlFor="search-input" 
            className={combineClasses(commonClasses.label, themeClasses.textPrimary)}
          >
            Search Work Codes
          </Label.Root>
          <div className="relative">
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by any field..."
              maxLength={100}
              className={combineClasses(
                commonClasses.workCodeSearchInput,
                themeClasses.background,
                themeClasses.border,
                themeClasses.textPrimary
              )}
            />
            <Search
              className={combineClasses(commonClasses.workCodeSearchIcon, themeClasses.textMuted)}
              size={20}
            />
          </div>
          <span className={combineClasses(commonClasses.workCodeSearchHint, themeClasses.textMuted)}>
            {searchQuery ? `Found ${filteredWorkCodes.length} result${filteredWorkCodes.length !== 1 ? 's' : ''}` : 'Search across all visible fields'}
          </span>
        </div>

        {/* Table */}
        <div className={combineClasses(
          commonClasses.workCodeTableWrapper,
          themeClasses.background,
          themeClasses.border
        )}>
          {isLoading ? (
            <div className={commonClasses.workCodeLoadingContainer}>
              <Loader2 className="animate-spin" style={{ color: 'var(--color-primary)' }} size={40} />
              <span className={combineClasses(commonClasses.workCodeLoadingText, themeClasses.textSecondary)}>
                Loading work codes...
              </span>
            </div>
          ) : (
            <ReactTabulator
              data={filteredWorkCodes}
              columns={[
                ...visibleColumns.map(col => ({
                  title: col.label,
                  field: col.key,
                  //headerFilter: 'input',
                  sorter: 'string',
                  tooltip: true,
                  formatter:
                    col.key === 'status'
                      ? (cell: any) => {
                          const value = cell.getValue();
                          return `<span class="px-2 py-1 text-xs font-medium rounded-full ${WorkCodeService.getStatusColor(
                            value
                          )}">${WorkCodeService.getStatusLabel(value)}</span>`;
                        }
                      : undefined,
                })),
                ...(hasVisibleActions
                  ? [
                      {
                        title: 'Actions',
                        field: 'actions',
                        hozAlign: 'center' as const,
                        headerSort: false,
                        width: 150,
                        formatter: (cell: any) => {
                          const data = cell.getRow().getData();
                          return `
                            <div style="display: flex; gap: 8px; justify-content: center;">
                              ${editActionConfig.visible && editActionConfig.enabled
                                ? `<Button class="edit-btn" data-id="${data.id}"
                                    style="padding: 6px; background: var(--color-primary); color: white; border: none; border-radius: 4px; cursor: pointer;">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                  </Button>`
                                : ''
                              }
                              ${deleteActionConfig.visible && deleteActionConfig.enabled
                                ? `<Button class="delete-btn" data-id="${data.id}"
                                    style="padding: 6px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                      <polyline points="3 6 5 6 21 6"></polyline>
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                  </Button>`
                                : ''
                              }
                            </div>
                          `;
                        },
                      },
                    ]
                  : []),
              ]}
              options={{
                layout: 'fitData',
                pagination: true,
                paginationSize: 10,
                height: '600px',
              }}
              events={{
                cellClick: (e: any, cell: any) => {
                  const target = e.target as HTMLElement;
                  const editBtn = target.closest('.edit-btn');
                  const deleteBtn = target.closest('.delete-btn');

                  if (editBtn) {
                    const id = editBtn.getAttribute('data-id');
                    const workCode = filteredWorkCodes.find(wc => wc.id === parseInt(id!));
                    if (workCode) onSelectWorkCode(workCode);
                  } else if (deleteBtn) {
                    const id = deleteBtn.getAttribute('data-id');
                    openDeleteDialog(parseInt(id!));
                  }
                },
              }}
            />
          )}
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

  return currentPage === 'list' ? (
    <WorkCodeList
      workCodes={workCodes}
      isLoading={isLoading}
      onSelectWorkCode={handleSelectWorkCode}
      onAddNew={handleAddNew}
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
  );
};

export default WorkCodeManagement;
