/**
 * User Permissions Panel Component
 * Allows administrators to assign attributes to users
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
  UserPlus,
  X,
  Key,
} from 'lucide-react';

import { useAbacApi } from '../hooks/AbacProvider';
import {
  User,
  SubjectAttribute,
} from '../services/abac-api.service';
import { styles } from './styles';

// ============================================================================
// Types
// ============================================================================

export interface UserPermissionsPanelProps {
  theme?: string;
}

// ============================================================================
// Component
// ============================================================================

export function UserPermissionsPanel({ theme }: UserPermissionsPanelProps) {
  const api = useAbacApi();

  const [users, setUsers] = useState<User[]>([]);
  const [subjectAttributes, setSubjectAttributes] = useState<SubjectAttribute[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userAttributes, setUserAttributes] = useState<SubjectAttribute[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedAttrId, setSelectedAttrId] = useState<number | ''>('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [removingAttrId, setRemovingAttrId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [usersData, attrsData] = await Promise.all([
        api.getActiveUsers(),
        api.getAllSubjectAttributes(),
      ]);
      setUsers(usersData);
      setSubjectAttributes(attrsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserAttributes = async (userId: number) => {
    setIsLoadingAttributes(true);
    try {
      const attrs = await api.getResolvedAttributesByUserId(userId);
      setUserAttributes(attrs);
    } catch (err) {
      console.error('Failed to load user attributes:', err);
      setUserAttributes([]);
    } finally {
      setIsLoadingAttributes(false);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    loadUserAttributes(user.userId);
  };

  const handleAssignAttribute = async () => {
    if (!selectedUser || !selectedAttrId) return;

    setIsSaving(true);
    try {
      await api.assignAttributeToUser({
        userId: selectedUser.userId,
        subjectAttrId: Number(selectedAttrId),
      });
      setIsAssignDialogOpen(false);
      setSelectedAttrId('');
      loadUserAttributes(selectedUser.userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign attribute');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveAttribute = async () => {
    if (!selectedUser || removingAttrId === null) return;

    setIsSaving(true);
    try {
      await api.removeAttributeFromUser(selectedUser.userId, removingAttrId);
      setDeleteConfirmOpen(false);
      setRemovingAttrId(null);
      loadUserAttributes(selectedUser.userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove attribute');
    } finally {
      setIsSaving(false);
    }
  };

  const usersColumns = useMemo<MRT_ColumnDef<User>[]>(() => [
    {
      accessorKey: 'userName',
      header: 'User',
      Cell: ({ row }) => (
        <div>
          <div style={{ fontWeight: 500 }}>{row.original.userName}</div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            {[row.original.firstName, row.original.lastName].filter(Boolean).join(' ') || 'No name'}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'userStatus',
      header: 'Status',
      Cell: ({ cell }) => (
        <span style={{ ...styles.badge, ...(cell.getValue<number>() === 1 ? styles.badgeSuccess : styles.badgeDanger) }}>
          {cell.getValue<number>() === 1 ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ], []);

  const usersTable = useMantineReactTable({
    columns: usersColumns,
    data: users,
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
    mantineTableBodyRowProps: ({ row }) => ({
      onClick: () => handleSelectUser(row.original),
      style: {
        cursor: 'pointer',
        backgroundColor: selectedUser?.userId === row.original.userId ? 'var(--color-primary-light)' : undefined,
      },
    }),
    renderTopToolbarCustomActions: () => (
      <Box style={{ display: 'flex', gap: '16px', padding: '8px' }}>
        <button onClick={loadData} style={{ ...styles.button, ...styles.secondaryButton }}>
          <RefreshCw size={16} />
        </button>
      </Box>
    ),
  });

  const userAttrColumns = useMemo<MRT_ColumnDef<SubjectAttribute>[]>(() => [
    {
      accessorKey: 'attributeName',
      header: 'Attribute',
      Cell: ({ cell }) => (
        <div style={{ fontWeight: 500 }}>{cell.getValue<string>() || 'Unknown'}</div>
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
      id: 'actions',
      header: 'Actions',
      enableColumnFilter: false,
      enableSorting: false,
      Cell: ({ row }) => (
        <div style={styles.actionButtons}>
          <button
            onClick={() => {
              setRemovingAttrId(row.original.subjectAttrId);
              setDeleteConfirmOpen(true);
            }}
            style={{ ...styles.iconButton, color: '#dc2626' }}
            title="Remove from user"
          >
            <X size={16} />
          </button>
        </div>
      ),
    },
  ], []);

  const userAttrTable = useMantineReactTable({
    columns: userAttrColumns,
    data: userAttributes,
    enablePagination: false,
    enableColumnFilters: false,
    enableGlobalFilter: false,
    enableSorting: true,
    enableFullScreenToggle: false,
    enableDensityToggle: false,
    enableTopToolbar: false,
    enableBottomToolbar: false,
    mantineTableProps: {
      striped: true,
      withTableBorder: true,
      withColumnBorders: true,
    },
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
      {/* Users List */}
      <div style={styles.card}>
        <MantineReactTable table={usersTable} />
      </div>

      {/* User Attributes (resolved = direct + group) */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>
            <Key size={18} style={{ marginRight: '8px', display: 'inline' }} />
            {selectedUser ? `Attributes for ${selectedUser.userName}` : 'Select a User'}
          </h3>
          {selectedUser && (
            <button
              onClick={() => setIsAssignDialogOpen(true)}
              style={{ ...styles.button, ...styles.primaryButton }}
            >
              <Plus size={16} />
              Assign Attribute
            </button>
          )}
        </div>
        <div style={styles.cardBody}>
          {!selectedUser ? (
            <div style={styles.emptyState}>
              <UserPlus size={48} style={{ marginBottom: 'var(--spacing-md)', opacity: 0.5 }} />
              <p>Select a user to view and manage their attributes</p>
            </div>
          ) : isLoadingAttributes ? (
            <div style={styles.loadingContainer}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Loading attributes...</span>
            </div>
          ) : (
            <MantineReactTable table={userAttrTable} />
          )}
        </div>
      </div>

      {/* Assign Attribute Dialog */}
      <Dialog.Root open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={styles.dialogOverlay} />
          <Dialog.Content style={styles.dialogContent}>
            <Dialog.Title style={styles.dialogTitle}>
              Assign Attribute to {selectedUser?.userName}
            </Dialog.Title>

            <div style={styles.formGroup}>
              <label style={styles.label}>Select Attribute Value *</label>
              <select
                value={selectedAttrId}
                onChange={(e) => setSelectedAttrId(e.target.value ? Number(e.target.value) : '')}
                style={styles.select}
              >
                <option value="">Select an attribute value...</option>
                {subjectAttributes.map(attr => (
                  <option key={attr.subjectAttrId} value={attr.subjectAttrId}>
                    {attr.attributeName || 'attr-' + attr.attributeId}: {attr.attributeValue}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.dialogActions}>
              <Dialog.Close asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button>
              </Dialog.Close>
              <button
                onClick={handleAssignAttribute}
                disabled={isSaving || !selectedAttrId}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: isSaving || !selectedAttrId ? 0.6 : 1,
                }}
              >
                {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                {isSaving ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Remove Attribute Confirmation */}
      <AlertDialog.Root open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay style={styles.dialogOverlay} />
          <AlertDialog.Content style={styles.dialogContent}>
            <AlertDialog.Title style={styles.dialogTitle}>Remove Attribute</AlertDialog.Title>
            <AlertDialog.Description style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
              Are you sure you want to remove this attribute assignment from the user?
            </AlertDialog.Description>
            <div style={styles.dialogActions}>
              <AlertDialog.Cancel asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  onClick={handleRemoveAttribute}
                  disabled={isSaving}
                  style={{ ...styles.button, ...styles.dangerButton }}
                >
                  {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={16} />}
                  {isSaving ? 'Removing...' : 'Remove'}
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
