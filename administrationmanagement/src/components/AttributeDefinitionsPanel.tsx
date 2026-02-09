/**
 * Attribute Definitions Management Panel Component
 * Allows administrators to manage attribute definitions across the system
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
  Trash2,
  Loader2,
  RefreshCw,
} from 'lucide-react';

import { useAbacApi } from '../hooks/AbacProvider';
import { AttributeDefinition } from '../services/abac-api.service';
import { styles } from './styles';

// ============================================================================
// Types
// ============================================================================

export interface AttributeDefinitionsPanelProps {
  theme?: string;
}

// ============================================================================
// Component
// ============================================================================

export function AttributeDefinitionsPanel({ theme }: AttributeDefinitionsPanelProps) {
  const api = useAbacApi();

  const [attributeDefinitions, setAttributeDefinitions] = useState<AttributeDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAttrDef, setNewAttrDef] = useState<{ attributeName: string; attributeCategoryId: number; dataTypeId: number; description: string }>({ attributeName: '', attributeCategoryId: 1, dataTypeId: 1, description: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingAttrDefId, setDeletingAttrDefId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true); setError(null);
    try { const data = await api.getAllAttributeDefinitions(); setAttributeDefinitions(data); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load attribute definitions'); }
    finally { setIsLoading(false); }
  };

  const handleCreate = async () => {
    if (!newAttrDef.attributeName) return;
    setIsSaving(true);
    try { const created = await api.createAttributeDefinition({ attributeName: newAttrDef.attributeName, attributeCategoryId: newAttrDef.attributeCategoryId, dataTypeId: newAttrDef.dataTypeId, description: newAttrDef.description }); setAttributeDefinitions(prev => [...prev, created]); setIsCreateDialogOpen(false); setNewAttrDef({ attributeName: '', attributeCategoryId: 1, dataTypeId: 1, description: '' }); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to create attribute definition'); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!deletingAttrDefId) return;
    setIsSaving(true);
    try { await api.deleteAttributeDefinition(deletingAttrDefId); setAttributeDefinitions(prev => prev.filter(a => a.attributeId !== deletingAttrDefId)); setDeleteConfirmOpen(false); setDeletingAttrDefId(null); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete attribute definition'); }
    finally { setIsSaving(false); }
  };

  const columns = useMemo<MRT_ColumnDef<AttributeDefinition>[]>(() => [
    { accessorKey: 'attributeName', header: 'Attribute Name', Cell: ({ cell }) => <span style={{ fontWeight: 500 }}>{cell.getValue<string>()}</span> },
    { accessorKey: 'attributeCategoryName', header: 'Category', Cell: ({ cell }) => <span style={{ ...styles.badge, ...styles.badgeInfo }}>{cell.getValue<string>()}</span> },
    { accessorKey: 'dataTypeName', header: 'Data Type', Cell: ({ cell }) => <span style={{ ...styles.badge, ...styles.badgeWarning }}>{cell.getValue<string>()}</span> },
    { accessorKey: 'description', header: 'Description', Cell: ({ cell }) => cell.getValue<string>() || '-' },
    { id: 'actions', header: 'Actions', enableColumnFilter: false, enableSorting: false, Cell: ({ row }) => (
      <div style={styles.actionButtons}><button onClick={() => { setDeletingAttrDefId(row.original.attributeId); setDeleteConfirmOpen(true); }} style={{ ...styles.iconButton, color: '#dc2626' }} title="Delete"><Trash2 size={16} /></button></div>
    ) },
  ], []);

  const table = useMantineReactTable({
    columns, data: attributeDefinitions,
    enableColumnFilters: true, enableGlobalFilter: true, enableSorting: true, enablePagination: true,
    enableColumnOrdering: true, enableFullScreenToggle: false, enableDensityToggle: true, enableStickyHeader: true,
    enableColumnResizing: true, layoutMode: 'semantic',
    initialState: { density: 'xs', showGlobalFilter: true, pagination: { pageSize: 10, pageIndex: 0 } },
    paginationDisplayMode: 'pages',
    state: { isLoading, showAlertBanner: !!error },
    mantineToolbarAlertBannerProps: error ? { color: 'red', children: error } : undefined,
    mantineTableProps: { striped: true, withTableBorder: true, withColumnBorders: true },
    mantineTableHeadCellProps: { align: 'center' }, mantineTableBodyCellProps: { align: 'center' },
    renderTopToolbarCustomActions: () => (
      <Box style={{ display: 'flex', gap: '16px', padding: '8px' }}>
        <button onClick={loadData} style={{ ...styles.button, ...styles.secondaryButton }}><RefreshCw size={16} /></button>
        <button onClick={() => setIsCreateDialogOpen(true)} style={{ ...styles.button, ...styles.primaryButton }}><Plus size={16} /> New Attribute</button>
      </Box>
    ),
  });

  return (
    <div style={styles.card}>
      <MantineReactTable table={table} />

      {/* Create Attribute Definition Dialog */}
      <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <Dialog.Portal><Dialog.Overlay style={styles.dialogOverlay} /><Dialog.Content style={styles.dialogContent}>
          <Dialog.Title style={styles.dialogTitle}>Create New Attribute Definition</Dialog.Title>
          <div style={styles.formGroup}><label style={styles.label}>Attribute Name *</label><input type="text" value={newAttrDef.attributeName} onChange={(e) => setNewAttrDef(prev => ({ ...prev, attributeName: e.target.value }))} style={styles.input} placeholder="e.g., department, role, clearanceLevel" /></div>
          <div style={styles.formGroup}><label style={styles.label}>Category *</label><select value={newAttrDef.attributeCategoryId} onChange={(e) => setNewAttrDef(prev => ({ ...prev, attributeCategoryId: Number(e.target.value) }))} style={styles.select}><option value={1}>Subject</option><option value={2}>Resource</option><option value={3}>Environment</option></select></div>
          <div style={styles.formGroup}><label style={styles.label}>Data Type *</label><select value={newAttrDef.dataTypeId} onChange={(e) => setNewAttrDef(prev => ({ ...prev, dataTypeId: Number(e.target.value) }))} style={styles.select}><option value={1}>String</option><option value={2}>Number</option><option value={3}>Boolean</option><option value={4}>Date</option><option value={5}>List</option></select></div>
          <div style={styles.formGroup}><label style={styles.label}>Description</label><textarea value={newAttrDef.description} onChange={(e) => setNewAttrDef(prev => ({ ...prev, description: e.target.value }))} style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }} placeholder="Enter attribute description" /></div>
          <div style={styles.dialogActions}>
            <Dialog.Close asChild><button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button></Dialog.Close>
            <button onClick={handleCreate} disabled={isSaving || !newAttrDef.attributeName} style={{ ...styles.button, ...styles.primaryButton, opacity: isSaving || !newAttrDef.attributeName ? 0.6 : 1 }}>{isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />} {isSaving ? 'Creating...' : 'Create Attribute'}</button>
          </div>
        </Dialog.Content></Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation */}
      <AlertDialog.Root open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialog.Portal><AlertDialog.Overlay style={styles.dialogOverlay} /><AlertDialog.Content style={styles.dialogContent}>
          <AlertDialog.Title style={styles.dialogTitle}>Delete Attribute Definition</AlertDialog.Title>
          <AlertDialog.Description style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>Are you sure you want to delete this attribute definition? This may affect existing subject/resource attributes and policy rules.</AlertDialog.Description>
          <div style={styles.dialogActions}><AlertDialog.Cancel asChild><button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button></AlertDialog.Cancel><AlertDialog.Action asChild><button onClick={handleDelete} disabled={isSaving} style={{ ...styles.button, ...styles.dangerButton }}>{isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={16} />} {isSaving ? 'Deleting...' : 'Delete'}</button></AlertDialog.Action></div>
        </AlertDialog.Content></AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
