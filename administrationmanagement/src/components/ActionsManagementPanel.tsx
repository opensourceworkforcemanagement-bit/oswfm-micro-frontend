/**
 * Actions Management Panel Component
 * Allows administrators to manage actions/operations available for policies
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
import { Operation } from '../services/abac-api.service';
import { styles } from './styles';

// ============================================================================
// Types
// ============================================================================

export interface ActionsManagementPanelProps {
  theme?: string;
}

// ============================================================================
// Component
// ============================================================================

export function ActionsManagementPanel({ theme }: ActionsManagementPanelProps) {
  const api = useAbacApi();

  const [actions, setActions] = useState<Operation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newAction, setNewAction] = useState<{ actionName: string; description: string }>({ actionName: '', description: '' });
  const [editingAction, setEditingAction] = useState<Operation | null>(null);
  const [editActionData, setEditActionData] = useState<{ operationName: string; description: string }>({ operationName: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingActionId, setDeletingActionId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true); setError(null);
    try { const data = await api.getAllOperations(); setActions(data); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load actions'); }
    finally { setIsLoading(false); }
  };

  const handleCreate = async () => {
    if (!newAction.actionName) return;
    setIsSaving(true);
    try { const created = await api.createOperation({ operationName: newAction.actionName, description: newAction.description }); setActions(prev => [...prev, created]); setIsCreateDialogOpen(false); setNewAction({ actionName: '', description: '' }); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to create action'); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!deletingActionId) return;
    setIsSaving(true);
    try { await api.deleteOperation(deletingActionId); setActions(prev => prev.filter(a => a.operationId !== deletingActionId)); setDeleteConfirmOpen(false); setDeletingActionId(null); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete action'); }
    finally { setIsSaving(false); }
  };

  const handleStartEdit = (action: Operation) => {
    setEditingAction(action);
    setEditActionData({ operationName: action.operationName, description: action.description || '' });
    setIsEditDialogOpen(true);
  };

  const handleEditAction = async () => {
    if (!editingAction || !editActionData.operationName) return;
    setIsSaving(true);
    try { const updated = await api.updateOperation(editingAction.operationId, { operationName: editActionData.operationName, description: editActionData.description }); setActions(prev => prev.map(a => a.operationId === editingAction.operationId ? updated : a)); setIsEditDialogOpen(false); setEditingAction(null); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to update action'); }
    finally { setIsSaving(false); }
  };

  const columns = useMemo<MRT_ColumnDef<Operation>[]>(() => [
    { accessorKey: 'operationName', header: 'Action Name', Cell: ({ cell }) => <span style={{ fontWeight: 500 }}>{cell.getValue<string>()}</span> },
    { accessorKey: 'description', header: 'Description', Cell: ({ cell }) => cell.getValue<string>() || '-' },
    { accessorKey: 'createdAt', header: 'Created', Cell: ({ cell }) => new Date(cell.getValue<string>()).toLocaleDateString() },
    {
      id: 'actions', header: 'Actions', enableColumnFilter: false, enableSorting: false,
      Cell: ({ row }) => (
        <div style={styles.actionButtons}>
          <button onClick={() => handleStartEdit(row.original)} style={{ ...styles.iconButton, color: 'var(--color-primary)' }} title="Edit"><Pencil size={16} /></button>
          <button onClick={() => { setDeletingActionId(row.original.operationId); setDeleteConfirmOpen(true); }} style={{ ...styles.iconButton, color: '#dc2626' }} title="Delete"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ], []);

  const table = useMantineReactTable({
    columns, data: actions,
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
        <button onClick={() => setIsCreateDialogOpen(true)} style={{ ...styles.button, ...styles.primaryButton }}><Plus size={16} /> New Action</button>
      </Box>
    ),
  });

  return (
    <div style={styles.card}>
      <MantineReactTable table={table} />

      {/* Create Action Dialog */}
      <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <Dialog.Portal><Dialog.Overlay style={styles.dialogOverlay} /><Dialog.Content style={styles.dialogContent}>
          <Dialog.Title style={styles.dialogTitle}>Create New Action</Dialog.Title>
          <div style={styles.formGroup}><label style={styles.label}>Action Name *</label><input type="text" value={newAction.actionName} onChange={(e) => setNewAction(prev => ({ ...prev, actionName: e.target.value }))} style={styles.input} placeholder="e.g., read, write, delete, execute" /></div>
          <div style={styles.formGroup}><label style={styles.label}>Description</label><textarea value={newAction.description} onChange={(e) => setNewAction(prev => ({ ...prev, description: e.target.value }))} style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }} placeholder="Enter action description" /></div>
          <div style={styles.dialogActions}>
            <Dialog.Close asChild><button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button></Dialog.Close>
            <button onClick={handleCreate} disabled={isSaving || !newAction.actionName} style={{ ...styles.button, ...styles.primaryButton, opacity: isSaving || !newAction.actionName ? 0.6 : 1 }}>
              {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />} {isSaving ? 'Creating...' : 'Create Action'}
            </button>
          </div>
        </Dialog.Content></Dialog.Portal>
      </Dialog.Root>

      {/* Edit Action Dialog */}
      <Dialog.Root open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <Dialog.Portal><Dialog.Overlay style={styles.dialogOverlay} /><Dialog.Content style={styles.dialogContent}>
          <Dialog.Title style={styles.dialogTitle}>Edit Action</Dialog.Title>
          <div style={styles.formGroup}><label style={styles.label}>Action Name *</label><input type="text" value={editActionData.operationName} onChange={(e) => setEditActionData(prev => ({ ...prev, operationName: e.target.value }))} style={styles.input} placeholder="e.g., read, write, delete, execute" /></div>
          <div style={styles.formGroup}><label style={styles.label}>Description</label><textarea value={editActionData.description} onChange={(e) => setEditActionData(prev => ({ ...prev, description: e.target.value }))} style={{ ...styles.input, minHeight: '80px', resize: 'vertical' as const }} placeholder="Enter action description" /></div>
          <div style={styles.dialogActions}>
            <Dialog.Close asChild><button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button></Dialog.Close>
            <button onClick={handleEditAction} disabled={isSaving || !editActionData.operationName} style={{ ...styles.button, ...styles.primaryButton, opacity: isSaving || !editActionData.operationName ? 0.6 : 1 }}>
              {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Pencil size={16} />} {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </Dialog.Content></Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation */}
      <AlertDialog.Root open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialog.Portal><AlertDialog.Overlay style={styles.dialogOverlay} /><AlertDialog.Content style={styles.dialogContent}>
          <AlertDialog.Title style={styles.dialogTitle}>Delete Action</AlertDialog.Title>
          <AlertDialog.Description style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>Are you sure you want to delete this action? This may affect policies that reference it.</AlertDialog.Description>
          <div style={styles.dialogActions}><AlertDialog.Cancel asChild><button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button></AlertDialog.Cancel><AlertDialog.Action asChild><button onClick={handleDelete} disabled={isSaving} style={{ ...styles.button, ...styles.dangerButton }}>{isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={16} />} {isSaving ? 'Deleting...' : 'Delete'}</button></AlertDialog.Action></div>
        </AlertDialog.Content></AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
