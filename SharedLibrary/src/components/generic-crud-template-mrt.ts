// ============================================================================
// GENERIC CRUD TEMPLATE - Mantine React Table version
// Full theme support, centralized styling, config-driven tabs and fields
//
// Replaces react-tabulator with mantine-react-table.
// Imports shared types from common.types.ts and BaseConfigManager from
// config.manager.ts so that field definitions (including the `tab` array
// and extended input types) and the config manager's API-persistence
// helpers are all available out of the box.
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Select from '@radix-ui/react-select';
import * as Label from '@radix-ui/react-label';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { ArrowLeft, Plus, Pencil, Trash2, ChevronDown, Loader2, Search, Check } from 'lucide-react';
import {
  MantineReactTable,
  useMantineReactTable,
  type MRT_ColumnDef,
  type MRT_Row,
  type MRT_TableOptions,
} from 'mantine-react-table';
import { ActionIcon, Tooltip, Flex } from '@mantine/core';

// Import shared project types and base classes
import {
  BaseEntity,
  FieldConfig,
  ColumnConfig,
  ActionConfig,
  PaginationConfig,
  TabConfig,
} from '../types/common.types.ts';
import { BaseConfigManager } from '../config/config.manager';

// Import centralized styles
import { commonClasses, themeClasses, combineClasses } from '../styles/styles.classes';

// Import API service layer
import { ApiResponse, CommonService } from '../services/common.services';

// ============================================================================
// PAGE CONFIG - extends the shared types with generics
// ============================================================================

interface PageConfig<T> {
  entityName: string;
  entityNamePlural: string;
  idField: keyof T;
  displayField: keyof T;
  columns: Record<string, ColumnConfig>;
  fields: Record<string, FieldConfig>;
  tabs: TabConfig[];
  actions: Record<string, ActionConfig>;
  pagination: PaginationConfig;
}

// ============================================================================
// GENERIC LIST COMPONENT - Mantine React Table
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const addActionConfig = pageConfig.actions.add;
  const editActionConfig = pageConfig.actions.edit;
  const deleteActionConfig = pageConfig.actions.delete;

  const hasVisibleActions = useMemo(() => {
    return editActionConfig.visible || deleteActionConfig.visible;
  }, [editActionConfig, deleteActionConfig]);

  // -----------------------------------------------------------------------
  // Build MRT column definitions from pageConfig.columns
  // -----------------------------------------------------------------------
  const columns = useMemo<MRT_ColumnDef<T>[]>(() => {
    return Object.entries(pageConfig.columns)
      .filter(([_, config]) => config.visible)
      .map(([key, config]) => {
        const colDef: MRT_ColumnDef<T> = {
          accessorKey: key,
          header: config.label,
          size: config.width,
        };

        // If a custom formatter is provided, use Cell to render it
        if (config.formatter) {
          const formatter = config.formatter;
          colDef.Cell = ({ cell }) => {
            const formatted = formatter(cell.getValue());
            // If formatter returns HTML (e.g. status badges), render via dangerouslySetInnerHTML
            if (formatted.includes('<')) {
              return React.createElement('span', {
                dangerouslySetInnerHTML: { __html: formatted },
              });
            }
            return React.createElement('span', null, formatted);
          };
        }

        return colDef;
      });
  }, [pageConfig.columns]);

  // -----------------------------------------------------------------------
  // Delete helpers
  // -----------------------------------------------------------------------
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

  // -----------------------------------------------------------------------
  // MRT table instance
  // -----------------------------------------------------------------------
  const table = useMantineReactTable<T>({
    columns,
    data: entities,
    // Column features
    enableColumnFilterModes: true,
    enableColumnOrdering: true,
    enableColumnResizing: true,
    // Global search
    enableGlobalFilter: true,
    // Pagination
    enablePagination: pageConfig.pagination.enabled,
    // Sorting
    enableSorting: true,
    // Row actions column
    enableRowActions: hasVisibleActions,
    positionActionsColumn: 'last',
    // State
    state: {
      isLoading,
    },
    initialState: {
      showGlobalFilter: true,
      pagination: {
        pageIndex: 0,
        pageSize: pageConfig.pagination.defaultPageSize,
      },
    },
    mantinePaginationProps: {
      rowsPerPageOptions: pageConfig.pagination.pageSizeOptions.map(String),
    },
    mantineTableContainerProps: {
      style: { maxHeight: '600px' },
    },
    // Row action buttons (Edit / Delete)
    renderRowActions: hasVisibleActions
      ? ({ row }) => {
          const entity = row.original;
          const displayValue = String(entity[pageConfig.displayField]);

          return React.createElement(
            Flex,
            { gap: 'xs' },
            editActionConfig.visible && editActionConfig.enabled
              ? React.createElement(
                  Tooltip,
                  { label: `Edit ${displayValue}`, position: 'left' },
                  React.createElement(
                    ActionIcon,
                    {
                      color: 'blue',
                      onClick: () => onSelectEntity(entity),
                      'aria-label': `Edit ${displayValue}`,
                    },
                    React.createElement(Pencil, { size: 16 })
                  )
                )
              : null,
            deleteActionConfig.visible && deleteActionConfig.enabled
              ? React.createElement(
                  Tooltip,
                  { label: `Delete ${displayValue}`, position: 'right' },
                  React.createElement(
                    ActionIcon,
                    {
                      color: 'red',
                      onClick: () =>
                        openDeleteDialog(entity[pageConfig.idField] as number | string),
                      'aria-label': `Delete ${displayValue}`,
                    },
                    React.createElement(Trash2, { size: 16 })
                  )
                )
              : null
          );
        }
      : undefined,
    // "Add" button in the top toolbar
    renderTopToolbarCustomActions: () => {
      if (!addActionConfig.visible) return null;

      return React.createElement(
        'button',
        {
          onClick: onAddNew,
          disabled: !addActionConfig.enabled,
          className: commonClasses.primaryButton,
          style: {
            backgroundColor: addActionConfig.enabled
              ? 'var(--color-primary)'
              : '#9ca3af',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: addActionConfig.enabled ? 'pointer' : 'not-allowed',
            opacity: addActionConfig.enabled ? 1 : 0.6,
            padding: 'var(--spacing-sm) var(--spacing-md)',
            fontWeight: 500,
            fontSize: 'var(--font-size-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          },
        },
        React.createElement(Plus, { size: 16 }),
        `Add ${pageConfig.entityName}`
      );
    },
  });

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return React.createElement(
    'div',
    {
      'data-theme': theme,
      style: {
        padding: 'var(--spacing-lg)',
        backgroundColor: 'var(--color-surface)',
        minHeight: '100vh',
        fontFamily: 'var(--font-family-sans)',
      },
    },
    React.createElement(
      'div',
      { style: { maxWidth: '1400px', margin: '0 auto' } },
      // Header
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--spacing-lg)',
          },
        },
        React.createElement(
          'h1',
          {
            className: commonClasses.pageTitle,
            style: { color: 'var(--color-text)' },
          },
          `${pageConfig.entityNamePlural} Directory`
        )
      ),
      // Mantine React Table
      React.createElement(
        'div',
        {
          className: commonClasses.tableContainer,
          style: {
            backgroundColor: 'var(--color-background)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
          },
        },
        React.createElement(MantineReactTable, { table })
      ),
      // Delete Confirmation Dialog (unchanged from original)
      React.createElement(
        AlertDialog.Root,
        { open: deleteDialogOpen, onOpenChange: setDeleteDialogOpen },
        React.createElement(
          AlertDialog.Portal,
          null,
          React.createElement(AlertDialog.Overlay, {
            className: commonClasses.dialogOverlay,
          }),
          React.createElement(
            AlertDialog.Content,
            {
              style: {
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
                boxShadow: 'var(--shadow-xl)',
              },
            },
            React.createElement(
              AlertDialog.Title,
              {
                className: commonClasses.dialogTitle,
                style: { color: 'var(--color-text)' },
              },
              `Delete ${pageConfig.entityName}`
            ),
            React.createElement(
              AlertDialog.Description,
              {
                className: commonClasses.dialogDescription,
                style: { color: 'var(--color-text-secondary)' },
              },
              `Are you sure you want to delete this ${pageConfig.entityName.toLowerCase()}? This action cannot be undone.`
            ),
            React.createElement(
              'div',
              {
                style: {
                  display: 'flex',
                  gap: 'var(--spacing-sm)',
                  justifyContent: 'flex-end',
                  marginTop: 'var(--spacing-lg)',
                },
              },
              React.createElement(
                AlertDialog.Cancel,
                { asChild: true },
                React.createElement(
                  'button',
                  {
                    disabled: isDeleting,
                    className: commonClasses.secondaryButton,
                    style: {
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      opacity: isDeleting ? 0.6 : 1,
                    },
                  },
                  'Cancel'
                )
              ),
              React.createElement(
                AlertDialog.Action,
                { asChild: true },
                React.createElement(
                  'button',
                  {
                    onClick: deleteRecord,
                    disabled: isDeleting,
                    className: commonClasses.dangerButton,
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-xs)',
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      opacity: isDeleting ? 0.6 : 1,
                    },
                  },
                  isDeleting
                    ? React.createElement(Loader2, {
                        style: { animation: 'spin 1s linear infinite' },
                        size: 16,
                      })
                    : null,
                  isDeleting ? 'Deleting...' : 'Delete'
                )
              )
            )
          )
        )
      )
    )
  );
}

// ============================================================================
// GENERIC FORM COMPONENT
// (Unchanged from original – uses Radix tabs, labels, selects)
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
      tab: [],
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

    // Boolean field (checkbox) – new type from common.types
    if (fieldConfig.type === 'boolean') {
      return (
        <div key={fieldName} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <input
            id={inputId}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => updateField(fieldName, e.target.checked)}
            disabled={isDisabled}
            style={{
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: isDisabled ? 0.6 : 1
            }}
          />
          <Label.Root htmlFor={inputId} className={commonClasses.label} style={{ color: 'var(--color-text-secondary)', fontWeight: 500, margin: 0 }}>
            {fieldConfig.label} {fieldConfig.required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
          </Label.Root>
          {fieldConfig.hint && (
            <span id={hintId} style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              {fieldConfig.hint}
            </span>
          )}
        </div>
      );
    }

    // All other input types: text, number, date, email, password, url, tel,
    // color, time, datetime-local, month, file, image
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
// Uses CommonService<T> from common.services.ts as the API layer
// ============================================================================

interface GenericCrudProps<T extends BaseEntity> {
  configManager: BaseConfigManager<PageConfig<T>>;
  apiService: CommonService<T>;
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
        const response = await apiService.update(
          selectedEntity[pageConfig.idField] as number | string,
          data
        );

        if (response.success && response.data) {
          setEntities(prev =>
            prev.map(e =>
              e[pageConfig.idField] === selectedEntity[pageConfig.idField]
                ? response.data!
                : e
            )
          );
        } else {
          throw new Error(response.message || 'Update failed');
        }
      } else {
        const response = await apiService.create(data, '');

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
// EXPORTS
// ============================================================================

export {
  GenericList,
  GenericForm,
  GenericCrud,
};

export type {
  PageConfig,
  GenericListProps,
  GenericFormProps,
  GenericCrudProps,
};
