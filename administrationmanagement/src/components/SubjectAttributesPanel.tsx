/**
 * Subject Attributes Panel Component (Decoupled - standalone CRUD)
 * Allows administrators to manage subject attribute values
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  MantineReactTable,
  useMantineReactTable,
  type MRT_ColumnDef,
} from 'mantine-react-table';
import { Box } from '@mantine/core';
import * as Dialog from '@radix-ui/react-dialog';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
} from 'lucide-react';

import { useAbacApi } from '../hooks/AbacProvider';
import {
  SubjectAttribute,
  AttributeDefinition,
  CreateSubjectAttributeRequest,
} from '../services/abac-api.service';
import { styles } from './styles';

// ============================================================================
// Types
// ============================================================================

export interface SubjectAttributesPanelProps {
  theme?: string;
}

// ============================================================================
// Component
// ============================================================================

export function SubjectAttributesPanel({ theme }: SubjectAttributesPanelProps) {
  const api = useAbacApi();

  const [subjectAttributes, setSubjectAttributes] = useState<SubjectAttribute[]>([]);
  const [attributeDefinitions, setAttributeDefinitions] = useState<AttributeDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newAttribute, setNewAttribute] = useState<Partial<CreateSubjectAttributeRequest>>({});
  const [editingAttribute, setEditingAttribute] = useState<SubjectAttribute | null>(null);
  const [editAttributeData, setEditAttributeData] = useState<{ attributeValue: string; validFrom: string; validUntil: string }>({ attributeValue: '', validFrom: '', validUntil: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingAttributeId, setDeletingAttributeId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [attrsData, attrDefsData] = await Promise.all([
        api.getAllSubjectAttributes(),
        api.getAllAttributeDefinitions(),
      ]);
      setSubjectAttributes(attrsData);
      setAttributeDefinitions(attrDefsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newAttribute.attributeId || !newAttribute.attributeValue) return;

    setIsSaving(true);
    try {
      const created = await api.createSubjectAttribute({
        attributeId: newAttribute.attributeId,
        attributeValue: newAttribute.attributeValue,
        validFrom: newAttribute.validFrom,
        validUntil: newAttribute.validUntil,
      });
      setSubjectAttributes(prev => [...prev, created]);
      setIsCreateDialogOpen(false);
      setNewAttribute({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create attribute');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = (attr: SubjectAttribute) => {
    setEditingAttribute(attr);
    setEditAttributeData({
      attributeValue: attr.attributeValue,
      validFrom: attr.validFrom || '',
      validUntil: attr.validUntil || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleEdit = async () => {
    if (!editingAttribute || !editAttributeData.attributeValue) return;

    setIsSaving(true);
    try {
      const updated = await api.updateSubjectAttribute(editingAttribute.subjectAttrId, {
        attributeValue: editAttributeData.attributeValue,
        validFrom: editAttributeData.validFrom || undefined,
        validUntil: editAttributeData.validUntil || undefined,
      });
      setSubjectAttributes(prev => prev.map(a => a.subjectAttrId === editingAttribute.subjectAttrId ? updated : a));
      setIsEditDialogOpen(false);
      setEditingAttribute(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update attribute');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deletingAttributeId === null) return;

    setIsSaving(true);
    try {
      await api.deleteSubjectAttribute(deletingAttributeId);
      setSubjectAttributes(prev => prev.filter(a => a.subjectAttrId !== deletingAttributeId));
      setDeleteConfirmOpen(false);
      setDeletingAttributeId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete attribute');
    } finally {
      setIsSaving(false);
    }
  };

  const getAttributeDefName = (attrId: number) => {
    const def = attributeDefinitions.find(d => Number(d.attributeId) === attrId);
    return def?.attributeName || 'Unknown';
  };

  const columns = useMemo<MRT_ColumnDef<SubjectAttribute>[]>(() => [
    {
      accessorFn: (row) => row.attributeName || getAttributeDefName(row.attributeId),
      id: 'attributeName',
      header: 'Attribute',
      Cell: ({ renderedCellValue }) => (
        <span style={{ fontWeight: 500 }}>{renderedCellValue}</span>
      ),
    },
    {
      accessorKey: 'attributeValue',
      header: 'Value',
      Cell: ({ cell }) => (
        <span style={{ ...styles.badge, ...styles.badgeInfo }}>
          {cell.getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'validFrom',
      header: 'Valid From',
      Cell: ({ cell }) => {
        const val = cell.getValue<string>();
        return val ? new Date(val).toLocaleDateString() : '-';
      },
    },
    {
      accessorKey: 'validUntil',
      header: 'Valid Until',
      Cell: ({ cell }) => {
        const val = cell.getValue<string>();
        return val ? new Date(val).toLocaleDateString() : '-';
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      enableColumnFilter: false,
      enableSorting: false,
      Cell: ({ row }) => (
        <div style={styles.actionButtons}>
          <button
            onClick={() => handleStartEdit(row.original)}
            style={{ ...styles.iconButton, color: 'var(--color-primary)' }}
            title="Edit"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => {
              setDeletingAttributeId(row.original.subjectAttrId);
              setDeleteConfirmOpen(true);
            }}
            style={{ ...styles.iconButton, color: '#dc2626' }}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ], [attributeDefinitions]);

  const table = useMantineReactTable({
    columns,
    data: subjectAttributes,
    enableColumnFilters: true,
    enableGlobalFilter: true,
    enableSorting: true,
    enablePagination: true,
    enableColumnOrdering: true,
    enableFullScreenToggle: false,
    enableDensityToggle: true,
    enableStickyHeader: true,
    enableColumnResizing: true,
    layoutMode: 'semantic',
    initialState: {
      density: 'xs',
      showGlobalFilter: true,
      pagination: { pageSize: 10, pageIndex: 0 },
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
    mantineTableHeadCellProps: { align: 'center' },
    mantineTableBodyCellProps: { align: 'center' },
    renderTopToolbarCustomActions: () => (
      <Box style={{ display: 'flex', gap: '16px', padding: '8px' }}>
        <button onClick={loadData} style={{ ...styles.button, ...styles.secondaryButton }}>
          <RefreshCw size={16} />
        </button>
        <button onClick={() => setIsCreateDialogOpen(true)} style={{ ...styles.button, ...styles.primaryButton }}>
          <Plus size={16} />
          New Attribute Value
        </button>
      </Box>
    ),
  });

  return (
    <div style={styles.card}>
      <MantineReactTable table={table} />

      {/* Create Attribute Value Dialog */}
      <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={styles.dialogOverlay} />
          <Dialog.Content style={styles.dialogContent}>
            <Dialog.Title style={styles.dialogTitle}>
              Create Subject Attribute Value
            </Dialog.Title>

            <div style={styles.formGroup}>
              <label style={styles.label}>Attribute Definition *</label>
              <select
                value={newAttribute.attributeId || ''}
                onChange={(e) => setNewAttribute(prev => ({ ...prev, attributeId: Number(e.target.value) }))}
                style={styles.select}
              >
                <option value="">Select an attribute...</option>
                {attributeDefinitions
                  .filter(d => d.attributeCategoryName?.toLowerCase() === 'subject')
                  .map(def => (
                    <option key={def.attributeId} value={def.attributeId}>
                      {def.attributeName} ({def.dataTypeName})
                    </option>
                  ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Value *</label>
              <input
                type="text"
                value={newAttribute.attributeValue || ''}
                onChange={(e) => setNewAttribute(prev => ({ ...prev, attributeValue: e.target.value }))}
                style={styles.input}
                placeholder="e.g., workforce_viewer, admin, HR"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Valid From</label>
              <input
                type="date"
                value={newAttribute.validFrom || ''}
                onChange={(e) => setNewAttribute(prev => ({ ...prev, validFrom: e.target.value }))}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Valid Until</label>
              <input
                type="date"
                value={newAttribute.validUntil || ''}
                onChange={(e) => setNewAttribute(prev => ({ ...prev, validUntil: e.target.value }))}
                style={styles.input}
              />
            </div>

            <div style={styles.dialogActions}>
              <Dialog.Close asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button>
              </Dialog.Close>
              <button
                onClick={handleCreate}
                disabled={isSaving || !newAttribute.attributeId || !newAttribute.attributeValue}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: isSaving || !newAttribute.attributeId || !newAttribute.attributeValue ? 0.6 : 1,
                }}
              >
                {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                {isSaving ? 'Creating...' : 'Create'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit Attribute Value Dialog */}
      <Dialog.Root open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={styles.dialogOverlay} />
          <Dialog.Content style={styles.dialogContent}>
            <Dialog.Title style={styles.dialogTitle}>
              Edit Attribute Value
            </Dialog.Title>

            <div style={styles.formGroup}>
              <label style={styles.label}>Value *</label>
              <input
                type="text"
                value={editAttributeData.attributeValue}
                onChange={(e) => setEditAttributeData(prev => ({ ...prev, attributeValue: e.target.value }))}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Valid From</label>
              <input
                type="date"
                value={editAttributeData.validFrom}
                onChange={(e) => setEditAttributeData(prev => ({ ...prev, validFrom: e.target.value }))}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Valid Until</label>
              <input
                type="date"
                value={editAttributeData.validUntil}
                onChange={(e) => setEditAttributeData(prev => ({ ...prev, validUntil: e.target.value }))}
                style={styles.input}
              />
            </div>

            <div style={styles.dialogActions}>
              <Dialog.Close asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button>
              </Dialog.Close>
              <button
                onClick={handleEdit}
                disabled={isSaving || !editAttributeData.attributeValue}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: isSaving || !editAttributeData.attributeValue ? 0.6 : 1,
                }}
              >
                {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Pencil size={16} />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation */}
      <AlertDialog.Root open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay style={styles.dialogOverlay} />
          <AlertDialog.Content style={styles.dialogContent}>
            <AlertDialog.Title style={styles.dialogTitle}>Delete Attribute Value</AlertDialog.Title>
            <AlertDialog.Description style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
              Are you sure you want to delete this attribute value? Any user or group assignments using it will also be removed.
            </AlertDialog.Description>
            <div style={styles.dialogActions}>
              <AlertDialog.Cancel asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  onClick={handleDelete}
                  disabled={isSaving}
                  style={{ ...styles.button, ...styles.dangerButton }}
                >
                  {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={16} />}
                  {isSaving ? 'Deleting...' : 'Delete'}
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
