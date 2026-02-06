// ============================================================================
// GENERIC CRUD TEMPLATE
// Full theme support, centralized styling, config-driven tabs and fields
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Select from '@radix-ui/react-select';
import * as Label from '@radix-ui/react-label';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { ArrowLeft, Plus, Pencil, Trash2, ChevronDown, Loader2, Search, Check } from 'lucide-react';
import { ReactTabulator } from 'react-tabulator';
import 'react-tabulator/css/tabulator.min.css';
import 'react-tabulator/css/bootstrap/tabulator_bootstrap.min.css';

// Import centralized styles
import { commonClasses, themeClasses, combineClasses } from '../../styles/styles.classes';

// ============================================================================
// TYPES - Define your entity structure
// ============================================================================

// Generic entity with ID
interface BaseEntity {
  id: number | string;
  [key: string]: any;
}

// Field configuration
interface FieldConfig {
  tab?: string[];
  enabled: boolean;
  readonly: boolean;
  visible: boolean;
  label: string;
  hint: string;
  required: boolean;
  type?: 'text' | 'textarea' | 'select' | 'date' | 'number' | 'email' | 'password' | 'boolean' | 'file' | 'image' | 'url' | 'tel' | 'color' | 'time' | 'datetime-local' | 'month' | 'checkbox' | 'radio';
  options?: Array<{ value: string | number; label: string }>;
  maxLength?: number;
  min?: number;
  max?: number;
  defaultValue?: string;
  validationRegex?: string;
  validationMessage?: string;
  displayOrder?: number;
}

// Column configuration
interface ColumnConfig {
  visible: boolean;
  label: string;
  width?: number;
  formatter?: (value: any) => string;
  sortable?: boolean;
  filterable?: boolean;
  displayOrder?: number;
}

// Tab configuration
interface TabConfig {
  id: string;
  label: string;
  visible: boolean;
  fields: string[]; // Array of field keys to display in this tab
}

// Action configuration
interface ActionConfig {
  enabled: boolean;
  visible: boolean;
  label?: string;
  actionType?: string;
  icon?: string;
  confirmationMessage?: string;
  errorMessage?: string;
  displayOrder?: number;
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

// ============================================================================
// CONFIGURATION MANAGER - Abstract base class
// ============================================================================

abstract class BaseConfigManager<T extends BaseEntity> {
  abstract getDefaultPageConfig(): PageConfig<T>;
  
  getColumnConfig(key: string): ColumnConfig | undefined {
    return this.getDefaultPageConfig().columns[key];
  }

  getFieldConfig(key: string): FieldConfig | undefined {
    return this.getDefaultPageConfig().fields[key];
  }

  getActionConfig(key: string): ActionConfig | undefined {
    return this.getDefaultPageConfig().actions[key];
  }

  getVisibleColumns(): string[] {
    const config = this.getDefaultPageConfig();
    return Object.entries(config.columns)
      .filter(([_, c]) => c.visible)
      .map(([k]) => k);
  }

  getVisibleFields(): string[] {
    const config = this.getDefaultPageConfig();
    return Object.entries(config.fields)
      .filter(([_, f]) => f.visible)
      .map(([k]) => k);
  }

  getVisibleTabs(): TabConfig[] {
    return this.getDefaultPageConfig().tabs.filter(tab => tab.visible);
  }

  getPaginationConfig() {
    return this.getDefaultPageConfig().pagination;
  }
}

// ============================================================================
// API SERVICE - Abstract base class
// ============================================================================

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  message: string;
}

abstract class BaseApiService<T extends BaseEntity> {
  abstract getAll(params?: any): Promise<ApiResponse<T[]>>;
  abstract getById(id: number | string): Promise<ApiResponse<T>>;
  abstract create(data: Partial<T>): Promise<ApiResponse<T>>;
  abstract update(id: number | string, data: Partial<T>): Promise<ApiResponse<T>>;
  abstract delete(id: number | string): Promise<ApiResponse<void>>;
}

// ============================================================================
// GENERIC LIST COMPONENT
// ============================================================================

interface GenericListProps<T extends BaseEntity> {
  entities: T[];
  isLoading: boolean;
  onSelectEntity: (entity: T) => void;
  onAddNew: () => void;
  onDelete: (id: number | string) => void;
  pageConfig: PageConfig<T>;
  theme?: string;
}

function GenericList<T extends BaseEntity>({
  entities,
  isLoading,
  onSelectEntity,
  onAddNew,
  onDelete,
  pageConfig,
  theme
}: GenericListProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
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

  const filteredEntities = useMemo(() => {
    if (!searchQuery.trim()) return entities;

    const query = searchQuery.toLowerCase();
    
    return entities.filter(entity => {
      return visibleFieldNames.some(fieldName => {
        const value = entity[fieldName];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(query);
      });
    });
  }, [entities, searchQuery, visibleFieldNames]);

  const hasVisibleActions = useMemo(() => {
    return editActionConfig.visible || deleteActionConfig.visible;
  }, [editActionConfig, deleteActionConfig]);

  const openDeleteDialog = (id: number | string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const deleteRecord = async () => {
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
    <div data-theme={theme} style={{ 
      padding: 'var(--spacing-lg)', 
      backgroundColor: 'var(--color-surface)', 
      minHeight: '100vh',
      fontFamily: 'var(--font-family-sans)'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
          <h1 className={commonClasses.pageTitle} style={{ color: 'var(--color-text)' }}>
            {pageConfig.entityNamePlural} Directory
          </h1>
          {addActionConfig.visible && (
            <button
              onClick={onAddNew}
              disabled={!addActionConfig.enabled}
              className={commonClasses.primaryButton}
              style={{
                backgroundColor: addActionConfig.enabled ? 'var(--color-primary)' : '#9ca3af',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: addActionConfig.enabled ? 'pointer' : 'not-allowed',
                opacity: addActionConfig.enabled ? 1 : 0.6,
                padding: 'var(--spacing-sm) var(--spacing-md)',
                fontWeight: 500,
                fontSize: 'var(--font-size-sm)'
              }}
            >
              <Plus size={16} />
              Add {pageConfig.entityName}
            </button>
          )}
        </div>

        {/* Search */}
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <Label.Root htmlFor="search-input" className={commonClasses.label} style={{ color: 'var(--color-text)' }}>
            Search {pageConfig.entityNamePlural}
          </Label.Root>
          <div style={{ position: 'relative' }}>
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by any field..."
              maxLength={100}
              className={commonClasses.inputField}
              style={{
                backgroundColor: 'var(--color-background)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
                paddingLeft: '2.5rem',
                borderRadius: 'var(--radius-md)'
              }}
            />
            <Search
              style={{ 
                position: 'absolute', 
                left: '0.75rem', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--color-text-muted)' 
              }}
              size={20}
            />
          </div>
          <span style={{ 
            fontSize: 'var(--font-size-xs)', 
            color: 'var(--color-text-muted)', 
            marginTop: '0.25rem', 
            display: 'block' 
          }}>
            {searchQuery ? `Found ${filteredEntities.length} result${filteredEntities.length !== 1 ? 's' : ''}` : 'Search across all visible fields'}
          </span>
        </div>

        {/* Table */}
        <div className={commonClasses.tableContainer} style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden'
        }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
              <Loader2 style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} size={40} />
              <span style={{ marginLeft: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Loading {pageConfig.entityNamePlural.toLowerCase()}...
              </span>
            </div>
          ) : (
            <ReactTabulator
              data={filteredEntities}
              columns={[
                ...visibleColumns.map(col => ({
                  title: col.label,
                  field: col.key,
                  headerFilter: 'input',
                  sorter: 'string',
                  tooltip: true,
                  width: col.width,
                  formatter: col.formatter ? (cell: any) => col.formatter!(cell.getValue()) : undefined,
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
                          const displayValue = data[pageConfig.displayField];
                          let html = '';
                          if (editActionConfig.visible && editActionConfig.enabled) {
                            html += `<button class="tabulator-btn-edit" aria-label="Edit ${displayValue}" style="padding: 4px 8px; margin-right: 4px; background: var(--color-primary-light); color: var(--color-primary); border: 1px solid var(--color-primary); border-radius: 4px; cursor: pointer; font-size: 12px;">✏️ Edit</button>`;
                          }
                          if (deleteActionConfig.visible && deleteActionConfig.enabled) {
                            html += `<button class="tabulator-btn-delete" aria-label="Delete ${displayValue}" style="padding: 4px 8px; background: #fee2e2; color: #dc2626; border: 1px solid #dc2626; border-radius: 4px; cursor: pointer; font-size: 12px;">🗑️ Delete</button>`;
                          }
                          return html;
                        },
                        cellClick: (e: any, cell: any) => {
                          const data = cell.getRow().getData();
                          if ((e.target as HTMLElement).classList.contains('tabulator-btn-edit')) {
                            onSelectEntity(data);
                          } else if ((e.target as HTMLElement).classList.contains('tabulator-btn-delete')) {
                            openDeleteDialog(data[pageConfig.idField]);
                          }
                        },
                      },
                    ]
                  : []),
              ]}
              options={{
                layout: 'fitColumns',
                pagination: pageConfig.pagination.enabled ? 'local' : undefined,
                paginationSize: pageConfig.pagination.defaultPageSize,
                movableColumns: true,
                tooltips: true,
                height: '600px',
              }}
            />
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialog.Portal>
            <AlertDialog.Overlay className={commonClasses.dialogOverlay} />
            <AlertDialog.Content 
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'var(--color-background)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-lg)',
                maxWidth: '400px',
                width: '100%',
                zIndex: 1000,
                boxShadow: 'var(--shadow-xl)'
              }}
            >
              <AlertDialog.Title className={commonClasses.dialogTitle} style={{ color: 'var(--color-text)' }}>
                Delete {pageConfig.entityName}
              </AlertDialog.Title>
              <AlertDialog.Description className={commonClasses.dialogDescription} style={{ color: 'var(--color-text-secondary)' }}>
                Are you sure you want to delete this {pageConfig.entityName.toLowerCase()}? This action cannot be undone.
              </AlertDialog.Description>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end', marginTop: 'var(--spacing-lg)' }}>
                <AlertDialog.Cancel asChild>
                  <button 
                    disabled={isDeleting}
                    className={commonClasses.secondaryButton}
                    style={{
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      opacity: isDeleting ? 0.6 : 1
                    }}
                  >
                    Cancel
                  </button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <button
                    onClick={deleteRecord}
                    disabled={isDeleting}
                    className={commonClasses.dangerButton}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 'var(--spacing-xs)',
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      opacity: isDeleting ? 0.6 : 1
                    }}
                  >
                    {isDeleting && <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={16} />}
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      </div>
    </div>
  );
}

// ============================================================================
// GENERIC FORM COMPONENT
// ============================================================================

interface GenericFormProps<T extends BaseEntity> {
  entity: T | null;
  onSave: (data: Partial<T>) => Promise<void>;
  onCancel: () => void;
  isNew: boolean;
  pageConfig: PageConfig<T>;
  theme?: string;
}

function GenericForm<T extends BaseEntity>({
  entity,
  onSave,
  onCancel,
  isNew,
  pageConfig,
  theme
}: GenericFormProps<T>) {
  const [formData, setFormData] = useState<Partial<T>>(entity || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleTabs = pageConfig.tabs.filter(tab => tab.visible);
  const saveAction = pageConfig.actions.save || pageConfig.actions.add;
  const cancelAction = pageConfig.actions.cancel || { enabled: true, visible: true };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!saveAction?.enabled) return;

    // Validate required fields
    const requiredFields = Object.entries(pageConfig.fields)
      .filter(([_, config]) => config.required && config.visible)
      .map(([key, config]) => ({ key, label: config.label }));

    for (const field of requiredFields) {
      if (!formData[field.key as keyof T]) {
        setError(`${field.label} is required`);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave(formData);
    } catch (err: any) {
      setError(err.message || `Failed to save ${pageConfig.entityName.toLowerCase()}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldConfig = (fieldName: string): FieldConfig => {
    return pageConfig.fields[fieldName] || {
      enabled: true,
      readonly: false,
      visible: true,
      label: fieldName,
      hint: '',
      required: false,
      type: 'text'
    };
  };

  const renderFieldInput = (fieldName: string) => {
    const fieldConfig = getFieldConfig(fieldName);
    
    if (!fieldConfig.visible) return null;

    const isDisabled = !fieldConfig.enabled || fieldConfig.readonly;
    const inputId = `field-${fieldName}`;
    const hintId = `${inputId}-hint`;
    const value = formData[fieldName as keyof T] || '';

    // Select field
    if (fieldConfig.type === 'select' && fieldConfig.options) {
      return (
        <div key={fieldName}>
          <Label.Root htmlFor={inputId} className={commonClasses.label} style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            {fieldConfig.label} {fieldConfig.required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
          </Label.Root>
          <Select.Root 
            value={String(value)} 
            onValueChange={(val) => updateField(fieldName, fieldConfig.type === 'number' ? Number(val) : val)}
            disabled={isDisabled}
          >
            <Select.Trigger 
              id={inputId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                backgroundColor: isDisabled ? 'var(--color-surface)' : 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text)',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                minWidth: '140px',
                opacity: isDisabled ? 0.6 : 1,
                width: '100%'
              }}
              disabled={isDisabled}
            >
              <Select.Value placeholder={fieldConfig.label} />
              <Select.Icon>
                <ChevronDown size={16} />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content style={{
                backgroundColor: 'var(--color-background)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                border: '1px solid var(--color-border)',
                overflow: 'hidden',
                zIndex: 1000
              }}>
                <Select.Viewport style={{ padding: 'var(--spacing-xs)' }}>
                  {fieldConfig.options.map(option => (
                    <Select.Item 
                      key={option.value} 
                      value={String(option.value)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        fontSize: 'var(--font-size-sm)',
                        cursor: 'pointer',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--color-text)',
                        outline: 'none'
                      }}
                    >
                      <Select.ItemIndicator>
                        <Check size={14} />
                      </Select.ItemIndicator>
                      <Select.ItemText>{option.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
          {fieldConfig.hint && (
            <span id={hintId} style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              {fieldConfig.hint}
            </span>
          )}
        </div>
      );
    }

    // Textarea field
    if (fieldConfig.type === 'textarea') {
      return (
        <div key={fieldName}>
          <Label.Root htmlFor={inputId} className={commonClasses.label} style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            {fieldConfig.label} {fieldConfig.required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
          </Label.Root>
          <textarea
            id={inputId}
            value={String(value)}
            onChange={(e) => updateField(fieldName, e.target.value)}
            rows={3}
            disabled={isDisabled}
            readOnly={fieldConfig.readonly}
            required={fieldConfig.required}
            maxLength={fieldConfig.maxLength || 1000}
            style={{
              width: '100%',
              padding: 'var(--spacing-sm) var(--spacing-md)',
              backgroundColor: isDisabled ? 'var(--color-surface)' : 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text)',
              outline: 'none',
              opacity: isDisabled ? 0.6 : 1,
              cursor: isDisabled ? 'not-allowed' : 'text',
              fontFamily: 'inherit'
            }}
          />
          {fieldConfig.hint && (
            <span id={hintId} style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              {fieldConfig.hint}
            </span>
          )}
        </div>
      );
    }

    // Text, number, date, email fields
    return (
      <div key={fieldName}>
        <Label.Root htmlFor={inputId} className={commonClasses.label} style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          {fieldConfig.label} {fieldConfig.required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </Label.Root>
        <input
          id={inputId}
          type={fieldConfig.type || 'text'}
          value={String(value)}
          onChange={(e) => updateField(fieldName, fieldConfig.type === 'number' ? Number(e.target.value) : e.target.value)}
          maxLength={fieldConfig.maxLength}
          min={fieldConfig.min}
          max={fieldConfig.max}
          disabled={isDisabled}
          readOnly={fieldConfig.readonly}
          required={fieldConfig.required}
          style={{
            width: '100%',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            backgroundColor: isDisabled ? 'var(--color-surface)' : 'var(--color-background)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text)',
            outline: 'none',
            opacity: isDisabled ? 0.6 : 1,
            cursor: isDisabled ? 'not-allowed' : 'text'
          }}
        />
        {fieldConfig.hint && (
          <span id={hintId} style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            {fieldConfig.hint}
          </span>
        )}
      </div>
    );
  };

  const tabStyle = {
    padding: 'var(--spacing-sm) var(--spacing-lg)',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 500,
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    color: 'var(--color-tab-inactive)'
  };

  return (
    <div data-theme={theme} style={{ 
      padding: 'var(--spacing-lg)', 
      backgroundColor: 'var(--color-surface)', 
      minHeight: '100vh',
      fontFamily: 'var(--font-family-sans)'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
          <button 
            onClick={onCancel}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--spacing-sm)',
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              color: 'var(--color-text)'
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className={commonClasses.pageTitle} style={{ color: 'var(--color-text)', margin: 0 }}>
            {isNew ? `Add New ${pageConfig.entityName}` : `Edit ${pageConfig.entityName}`}
          </h1>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            marginBottom: 'var(--spacing-md)',
            padding: 'var(--spacing-md)',
            backgroundColor: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--color-danger)',
            fontSize: 'var(--font-size-sm)'
          }}>
            {error}
          </div>
        )}

        {/* Form with Tabs */}
        <div style={{ 
          backgroundColor: 'var(--color-background)', 
          borderRadius: 'var(--radius-lg)', 
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden'
        }}>
          <Tabs.Root defaultValue={visibleTabs[0]?.id}>
            <Tabs.List style={{ 
              display: 'flex', 
              borderBottom: '1px solid var(--color-border)', 
              padding: '0 var(--spacing-md)',
              backgroundColor: 'var(--color-surface)'
            }}>
              {visibleTabs.map(tab => (
                <Tabs.Trigger key={tab.id} value={tab.id} style={tabStyle}>
                  {tab.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <div style={{ padding: 'var(--spacing-lg)' }}>
              {visibleTabs.map(tab => (
                <Tabs.Content key={tab.id} value={tab.id}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: tab.fields.length > 4 ? '1fr 1fr' : '1fr', 
                    gap: 'var(--spacing-lg)', 
                    maxWidth: '600px' 
                  }}>
                    {tab.fields.map(fieldName => renderFieldInput(fieldName))}
                  </div>
                </Tabs.Content>
              ))}
            </div>
          </Tabs.Root>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--spacing-md)',
            padding: 'var(--spacing-lg)',
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)'
          }}>
            {cancelAction?.visible && (
              <button
                onClick={onCancel}
                disabled={!cancelAction.enabled || isSubmitting}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-lg)',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  cursor: (cancelAction.enabled && !isSubmitting) ? 'pointer' : 'not-allowed',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text)',
                  opacity: (cancelAction.enabled && !isSubmitting) ? 1 : 0.6
                }}
              >
                Cancel
              </button>
            )}
            {saveAction?.visible && (
              <button
                onClick={handleSave}
                disabled={!saveAction.enabled || isSubmitting}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-lg)',
                  backgroundColor: (saveAction.enabled && !isSubmitting) ? 'var(--color-primary)' : '#9ca3af',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: (saveAction.enabled && !isSubmitting) ? 'pointer' : 'not-allowed',
                  fontSize: 'var(--font-size-sm)',
                  color: 'white',
                  fontWeight: 500,
                  opacity: (saveAction.enabled && !isSubmitting) ? 1 : 0.6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-xs)'
                }}
              >
                {isSubmitting && <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={16} />}
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// GENERIC CRUD CONTAINER COMPONENT
// ============================================================================

interface GenericCrudProps<T extends BaseEntity> {
  configManager: BaseConfigManager<T>;
  apiService: BaseApiService<T>;
  theme?: string;
}

function GenericCrud<T extends BaseEntity>({
  configManager,
  apiService,
  theme = 'brand-a'
}: GenericCrudProps<T>) {
  const [entities, setEntities] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<'list' | 'form'>('list');
  const [selectedEntity, setSelectedEntity] = useState<T | null>(null);

  const pageConfig = configManager.getDefaultPageConfig();

  useEffect(() => {
    fetchEntities();
  }, []);

  const fetchEntities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.getAll();
      
      if (response.success && response.data) {
        setEntities(response.data);
      } else {
        setError(response.message || `Failed to fetch ${pageConfig.entityNamePlural.toLowerCase()}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error(`Error fetching ${pageConfig.entityNamePlural.toLowerCase()}:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectEntity = (entity: T) => {
    setSelectedEntity(entity);
    setCurrentPage('form');
  };

  const handleAddNew = () => {
    setSelectedEntity(null);
    setCurrentPage('form');
  };

  const handleSave = async (data: Partial<T>) => {
    try {
      if (selectedEntity) {
        // Update existing
        const response = await apiService.update(selectedEntity[pageConfig.idField] as number | string, data);
        
        if (response.success && response.data) {
          setEntities(prev => prev.map(e => 
            e[pageConfig.idField] === selectedEntity[pageConfig.idField] ? response.data! : e
          ));
        } else {
          throw new Error(response.message || 'Update failed');
        }
      } else {
        // Create new
        const response = await apiService.create(data);
        
        if (response.success && response.data) {
          setEntities(prev => [...prev, response.data!]);
        } else {
          throw new Error(response.message || 'Create failed');
        }
      }
      
      setCurrentPage('list');
      setSelectedEntity(null);
    } catch (err) {
      throw err; // Let the form handle the error display
    }
  };

  const handleCancel = () => {
    setCurrentPage('list');
    setSelectedEntity(null);
  };

  const handleDelete = async (id: number | string) => {
    try {
      const response = await apiService.delete(id);
      
      if (response.success) {
        setEntities(prev => prev.filter(e => e[pageConfig.idField] !== id));
      } else {
        throw new Error(response.message || 'Delete failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error(`Error deleting ${pageConfig.entityName.toLowerCase()}:`, err);
      alert(`Failed to delete ${pageConfig.entityName.toLowerCase()}: ${message}`);
      throw err;
    }
  };

  return currentPage === 'list' ? (
    <GenericList<T>
      entities={entities}
      isLoading={isLoading}
      onSelectEntity={handleSelectEntity}
      onAddNew={handleAddNew}
      onDelete={handleDelete}
      pageConfig={pageConfig}
      theme={theme}
    />
  ) : (
    <GenericForm<T>
      entity={selectedEntity}
      onSave={handleSave}
      onCancel={handleCancel}
      isNew={!selectedEntity}
      pageConfig={pageConfig}
      theme={theme}
    />
  );
}

// ============================================================================
// EXAMPLE IMPLEMENTATION - Product Management
// ============================================================================

// 1. Define your entity type
interface Product extends BaseEntity {
  id: number;
  name: string;
  sku: string;
  description: string;
  price: number;
  category: string;
  status: 'active' | 'inactive' | 'discontinued';
  stock: number;
  supplier: string;
  createdAt: string;
}

// 2. Create your configuration manager
class ProductConfigManager extends BaseConfigManager<Product> {
  getDefaultPageConfig(): PageConfig<Product> {
    return {
      entityName: 'Product',
      entityNamePlural: 'Products',
      idField: 'id',
      displayField: 'name',
      columns: {
        id: { visible: true, label: 'ID', width: 80 },
        name: { visible: true, label: 'Product Name', width: 200 },
        sku: { visible: true, label: 'SKU', width: 120 },
        category: { visible: true, label: 'Category', width: 150 },
        price: { 
          visible: true, 
          label: 'Price', 
          width: 100,
          formatter: (value) => `${value.toFixed(2)}`
        },
        stock: { visible: true, label: 'Stock', width: 100 },
        status: { 
          visible: true, 
          label: 'Status', 
          width: 120,
          formatter: (value) => {
            const colors = {
              active: 'bg-green-100 text-green-700',
              inactive: 'bg-gray-100 text-gray-700',
              discontinued: 'bg-red-100 text-red-700'
            };
            return `<span class="px-2 py-1 text-xs font-medium rounded-full ${colors[value as keyof typeof colors]}">${value}</span>`;
          }
        }
      },
      fields: {
        name: { 
          enabled: true, 
          readonly: false, 
          visible: true,
          label: 'Product Name',
          hint: 'Enter the product name',
          required: true,
          type: 'text',
          maxLength: 100
        },
        sku: { 
          enabled: true, 
          readonly: false, 
          visible: true,
          label: 'SKU',
          hint: 'Stock Keeping Unit',
          required: true,
          type: 'text',
          maxLength: 50
        },
        category: { 
          enabled: true, 
          readonly: false, 
          visible: true,
          label: 'Category',
          hint: 'Select product category',
          required: true,
          type: 'select',
          options: [
            { value: 'Electronics', label: 'Electronics' },
            { value: 'Clothing', label: 'Clothing' },
            { value: 'Food', label: 'Food' },
            { value: 'Books', label: 'Books' }
          ]
        },
        price: { 
          enabled: true, 
          readonly: false, 
          visible: true,
          label: 'Price',
          hint: 'Product price in USD',
          required: true,
          type: 'number',
          min: 0
        },
        stock: { 
          enabled: true, 
          readonly: false, 
          visible: true,
          label: 'Stock Quantity',
          hint: 'Available inventory',
          required: true,
          type: 'number',
          min: 0
        },
        status: { 
          enabled: true, 
          readonly: false, 
          visible: true,
          label: 'Status',
          hint: 'Product status',
          required: true,
          type: 'select',
          options: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'discontinued', label: 'Discontinued' }
          ]
        },
        supplier: { 
          enabled: true, 
          readonly: false, 
          visible: true,
          label: 'Supplier',
          hint: 'Supplier name',
          required: false,
          type: 'text',
          maxLength: 100
        },
        description: { 
          enabled: true, 
          readonly: false, 
          visible: true,
          label: 'Description',
          hint: 'Detailed product description',
          required: false,
          type: 'textarea',
          maxLength: 500
        }
      },
      tabs: [
        {
          id: 'general',
          label: 'General Information',
          visible: true,
          fields: ['name', 'sku', 'category', 'price', 'stock', 'status']
        },
        {
          id: 'details',
          label: 'Additional Details',
          visible: true,
          fields: ['supplier', 'description']
        }
      ],
      actions: {
        add: { enabled: true, visible: true },
        edit: { enabled: true, visible: true },
        delete: { enabled: true, visible: true },
        save: { enabled: true, visible: true },
        cancel: { enabled: true, visible: true }
      },
      pagination: {
        enabled: true,
        defaultPageSize: 10,
        pageSizeOptions: [10, 25, 50, 100]
      }
    };
  }
}

// 3. Create your API service (mock implementation)
class ProductApiService extends BaseApiService<Product> {
  private mockData: Product[] = [
    { id: 1, name: 'Laptop Pro', sku: 'LP-001', description: 'High-performance laptop', price: 1299.99, category: 'Electronics', status: 'active', stock: 50, supplier: 'Tech Corp', createdAt: '2024-01-15' },
    { id: 2, name: 'Wireless Mouse', sku: 'WM-002', description: 'Ergonomic wireless mouse', price: 29.99, category: 'Electronics', status: 'active', stock: 200, supplier: 'Tech Corp', createdAt: '2024-02-20' },
    { id: 3, name: 'Office Chair', sku: 'OC-003', description: 'Comfortable office chair', price: 249.99, category: 'Furniture', status: 'active', stock: 30, supplier: 'Furniture Inc', createdAt: '2024-03-10' }
  ];

  async getAll(params?: any): Promise<ApiResponse<Product[]>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      data: this.mockData,
      error: null,
      message: 'Products fetched successfully'
    };
  }

  async getById(id: number | string): Promise<ApiResponse<Product>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const product = this.mockData.find(p => p.id === id);
    
    if (product) {
      return {
        success: true,
        data: product,
        error: null,
        message: 'Product fetched successfully'
      };
    }
    
    return {
      success: false,
      data: null,
      error: 'Not found',
      message: 'Product not found'
    };
  }

  async create(data: Partial<Product>): Promise<ApiResponse<Product>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newProduct: Product = {
      ...data,
      id: Math.max(...this.mockData.map(p => p.id)) + 1,
      createdAt: new Date().toISOString()
    } as Product;
    
    this.mockData.push(newProduct);
    
    return {
      success: true,
      data: newProduct,
      error: null,
      message: 'Product created successfully'
    };
  }

  async update(id: number | string, data: Partial<Product>): Promise<ApiResponse<Product>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const index = this.mockData.findIndex(p => p.id === id);
    
    if (index !== -1) {
      this.mockData[index] = { ...this.mockData[index], ...data };
      
      return {
        success: true,
        data: this.mockData[index],
        error: null,
        message: 'Product updated successfully'
      };
    }
    
    return {
      success: false,
      data: null,
      error: 'Not found',
      message: 'Product not found'
    };
  }

  async delete(id: number | string): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const index = this.mockData.findIndex(p => p.id === id);
    
    if (index !== -1) {
      this.mockData.splice(index, 1);
      
      return {
        success: true,
        data: null,
        error: null,
        message: 'Product deleted successfully'
      };
    }
    
    return {
      success: false,
      data: null,
      error: 'Not found',
      message: 'Product not found'
    };
  }
}

// 4. Use the generic CRUD component
const ProductManagement: React.FC = () => {
  const configManager = new ProductConfigManager();
  const apiService = new ProductApiService();

  return (
    <GenericCrud<Product>
      configManager={configManager}
      apiService={apiService}
      theme="brand-a"
    />
  );
};

export default ProductManagement;