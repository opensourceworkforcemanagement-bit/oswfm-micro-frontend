/**
 * User Groups Panel Component
 * Allows administrators to manage user groups, memberships, and group attributes
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
  UserPlus,
  X,
  FileText,
  Users,
} from 'lucide-react';

import { useAbacApi } from '../hooks/AbacProvider';
import {
  User,
  UserGroup,
  UserGroupMembership,
  SubjectAttribute,
  GroupSubjectAttribute,
} from '../services/abac-api.service';
import { styles } from './styles';

// ============================================================================
// Types
// ============================================================================

export interface UserGroupsPanelProps {
  theme?: string;
}

// ============================================================================
// Component
// ============================================================================

export function UserGroupsPanel({ theme }: UserGroupsPanelProps) {
  const api = useAbacApi();

  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [subjectAttributes, setSubjectAttributes] = useState<SubjectAttribute[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<UserGroupMembership[]>([]);
  const [groupAttributes, setGroupAttributes] = useState<GroupSubjectAttribute[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group CRUD
  const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false);
  const [isEditGroupDialogOpen, setIsEditGroupDialogOpen] = useState(false);
  const [newGroup, setNewGroup] = useState<{ groupName: string; description: string }>({ groupName: '', description: '' });
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [editGroupData, setEditGroupData] = useState<{ groupName: string; description: string }>({ groupName: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteGroupConfirmOpen, setDeleteGroupConfirmOpen] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<number | null>(null);

  // Membership
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [removeMemberConfirmOpen, setRemoveMemberConfirmOpen] = useState(false);
  const [removingMembershipId, setRemovingMembershipId] = useState<number | null>(null);

  // Group Attribute Assignment
  const [isAssignAttrDialogOpen, setIsAssignAttrDialogOpen] = useState(false);
  const [selectedAttrId, setSelectedAttrId] = useState<number | ''>('');
  const [removeAttrConfirmOpen, setRemoveAttrConfirmOpen] = useState(false);
  const [removingGroupAttrId, setRemovingGroupAttrId] = useState<{ groupId: number; subjectAttrId: number } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [groupsData, usersData, attrsData] = await Promise.all([
        api.getAllUserGroups(),
        api.getActiveUsers(),
        api.getAllSubjectAttributes(),
      ]);
      setGroups(groupsData);
      setUsers(usersData);
      setSubjectAttributes(attrsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadGroupDetails = async (groupId: number) => {
    setIsLoadingDetails(true);
    try {
      const [members, attrs] = await Promise.all([
        api.getMembersByGroupId(groupId),
        api.getAttributesByGroupId(groupId),
      ]);
      setGroupMembers(members);
      setGroupAttributes(attrs);
    } catch (err) {
      console.error('Failed to load group details:', err);
      setGroupMembers([]);
      setGroupAttributes([]);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSelectGroup = (group: UserGroup) => {
    setSelectedGroup(group);
    loadGroupDetails(group.groupId);
  };

  const handleCreateGroup = async () => {
    if (!newGroup.groupName) return;
    setIsSaving(true);
    try {
      const created = await api.createUserGroup({
        groupName: newGroup.groupName,
        description: newGroup.description || undefined,
      });
      setGroups(prev => [...prev, created]);
      setIsCreateGroupDialogOpen(false);
      setNewGroup({ groupName: '', description: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEditGroup = (group: UserGroup) => {
    setEditingGroup(group);
    setEditGroupData({ groupName: group.groupName, description: group.description || '' });
    setIsEditGroupDialogOpen(true);
  };

  const handleEditGroup = async () => {
    if (!editingGroup || !editGroupData.groupName) return;
    setIsSaving(true);
    try {
      const updated = await api.updateUserGroup(editingGroup.groupId, {
        groupName: editGroupData.groupName,
        description: editGroupData.description || undefined,
      });
      setGroups(prev => prev.map(g => g.groupId === editingGroup.groupId ? updated : g));
      if (selectedGroup?.groupId === editingGroup.groupId) {
        setSelectedGroup(updated);
      }
      setIsEditGroupDialogOpen(false);
      setEditingGroup(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update group');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (deletingGroupId === null) return;
    setIsSaving(true);
    try {
      await api.deleteUserGroup(deletingGroupId);
      setGroups(prev => prev.filter(g => g.groupId !== deletingGroupId));
      if (selectedGroup?.groupId === deletingGroupId) {
        setSelectedGroup(null);
        setGroupMembers([]);
        setGroupAttributes([]);
      }
      setDeleteGroupConfirmOpen(false);
      setDeletingGroupId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete group');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedGroup || !selectedUserId) return;
    setIsSaving(true);
    try {
      await api.addUserToGroup({
        userId: Number(selectedUserId),
        groupId: selectedGroup.groupId,
      });
      setIsAddMemberDialogOpen(false);
      setSelectedUserId('');
      loadGroupDetails(selectedGroup.groupId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMember = async () => {
    if (removingMembershipId === null || !selectedGroup) return;
    setIsSaving(true);
    try {
      await api.removeUserFromGroup(removingMembershipId);
      setRemoveMemberConfirmOpen(false);
      setRemovingMembershipId(null);
      loadGroupDetails(selectedGroup.groupId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignAttribute = async () => {
    if (!selectedGroup || !selectedAttrId) return;
    setIsSaving(true);
    try {
      await api.assignAttributeToGroup({
        groupId: selectedGroup.groupId,
        subjectAttrId: Number(selectedAttrId),
      });
      setIsAssignAttrDialogOpen(false);
      setSelectedAttrId('');
      loadGroupDetails(selectedGroup.groupId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign attribute to group');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveGroupAttribute = async () => {
    if (!removingGroupAttrId || !selectedGroup) return;
    setIsSaving(true);
    try {
      await api.removeAttributeFromGroup(removingGroupAttrId.groupId, removingGroupAttrId.subjectAttrId);
      setRemoveAttrConfirmOpen(false);
      setRemovingGroupAttrId(null);
      loadGroupDetails(selectedGroup.groupId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove attribute from group');
    } finally {
      setIsSaving(false);
    }
  };

  const groupsColumns = useMemo<MRT_ColumnDef<UserGroup>[]>(() => [
    {
      accessorKey: 'groupName',
      header: 'Group',
      Cell: ({ row }) => (
        <div>
          <div style={{ fontWeight: 500 }}>{row.original.groupName}</div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            {row.original.description || 'No description'}
          </div>
        </div>
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
            onClick={(e) => { e.stopPropagation(); handleStartEditGroup(row.original); }}
            style={{ ...styles.iconButton, color: 'var(--color-primary)' }}
            title="Edit"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeletingGroupId(row.original.groupId);
              setDeleteGroupConfirmOpen(true);
            }}
            style={{ ...styles.iconButton, color: '#dc2626' }}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ], []);

  const groupsTable = useMantineReactTable({
    columns: groupsColumns,
    data: groups,
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
      onClick: () => handleSelectGroup(row.original),
      style: {
        cursor: 'pointer',
        backgroundColor: selectedGroup?.groupId === row.original.groupId ? 'var(--color-primary-light)' : undefined,
      },
    }),
    renderTopToolbarCustomActions: () => (
      <Box style={{ display: 'flex', gap: '16px', padding: '8px' }}>
        <button onClick={loadData} style={{ ...styles.button, ...styles.secondaryButton }}>
          <RefreshCw size={16} />
        </button>
        <button onClick={() => setIsCreateGroupDialogOpen(true)} style={{ ...styles.button, ...styles.primaryButton }}>
          <Plus size={16} />
          New Group
        </button>
      </Box>
    ),
  });

  const membersColumns = useMemo<MRT_ColumnDef<UserGroupMembership>[]>(() => [
    {
      accessorFn: (row) => row.username || `User #${row.userId}`,
      id: 'username',
      header: 'User',
      Cell: ({ renderedCellValue }) => (
        <span style={{ fontWeight: 500 }}>{renderedCellValue}</span>
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
              setRemovingMembershipId(row.original.membershipId);
              setRemoveMemberConfirmOpen(true);
            }}
            style={{ ...styles.iconButton, color: '#dc2626' }}
            title="Remove member"
          >
            <X size={16} />
          </button>
        </div>
      ),
    },
  ], []);

  const membersTable = useMantineReactTable({
    columns: membersColumns,
    data: groupMembers,
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

  const groupAttrColumns = useMemo<MRT_ColumnDef<GroupSubjectAttribute>[]>(() => [
    {
      accessorKey: 'attributeName',
      header: 'Attribute',
      Cell: ({ cell }) => (
        <span style={{ fontWeight: 500 }}>{cell.getValue<string>() || 'Unknown'}</span>
      ),
    },
    {
      accessorKey: 'attributeValue',
      header: 'Value',
      Cell: ({ cell }) => (
        <span style={{ ...styles.badge, ...styles.badgeInfo }}>
          {cell.getValue<string>() || '-'}
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
              setRemovingGroupAttrId({ groupId: row.original.groupId, subjectAttrId: row.original.subjectAttrId });
              setRemoveAttrConfirmOpen(true);
            }}
            style={{ ...styles.iconButton, color: '#dc2626' }}
            title="Remove attribute"
          >
            <X size={16} />
          </button>
        </div>
      ),
    },
  ], []);

  const groupAttrTable = useMantineReactTable({
    columns: groupAttrColumns,
    data: groupAttributes,
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
      {/* Groups List */}
      <div style={styles.card}>
        <MantineReactTable table={groupsTable} />
      </div>

      {/* Group Details (Members + Attributes) */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>
            <FileText size={18} style={{ marginRight: '8px', display: 'inline' }} />
            {selectedGroup ? selectedGroup.groupName : 'Select a Group'}
          </h3>
          {selectedGroup && (
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
              <button
                onClick={() => setIsAddMemberDialogOpen(true)}
                style={{ ...styles.button, ...styles.secondaryButton }}
              >
                <UserPlus size={16} />
                Add Member
              </button>
              <button
                onClick={() => setIsAssignAttrDialogOpen(true)}
                style={{ ...styles.button, ...styles.primaryButton }}
              >
                <Plus size={16} />
                Assign Attribute
              </button>
            </div>
          )}
        </div>
        <div style={styles.cardBody}>
          {!selectedGroup ? (
            <div style={styles.emptyState}>
              <Users size={48} style={{ marginBottom: 'var(--spacing-md)', opacity: 0.5 }} />
              <p>Select a group to view members and attributes</p>
            </div>
          ) : isLoadingDetails ? (
            <div style={styles.loadingContainer}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Loading group details...</span>
            </div>
          ) : (
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)', textTransform: 'uppercase' as const }}>
                Members
              </h4>
              <MantineReactTable table={membersTable} />

              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-sm)', textTransform: 'uppercase' as const }}>
                Assigned Attributes
              </h4>
              <MantineReactTable table={groupAttrTable} />
            </div>
          )}
        </div>
      </div>

      {/* Create Group Dialog */}
      <Dialog.Root open={isCreateGroupDialogOpen} onOpenChange={setIsCreateGroupDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={styles.dialogOverlay} />
          <Dialog.Content style={styles.dialogContent}>
            <Dialog.Title style={styles.dialogTitle}>Create New Group</Dialog.Title>
            <div style={styles.formGroup}>
              <label style={styles.label}>Group Name *</label>
              <input type="text" value={newGroup.groupName} onChange={(e) => setNewGroup(prev => ({ ...prev, groupName: e.target.value }))} style={styles.input} placeholder="e.g., Workforce Viewers, HR Admins" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea value={newGroup.description} onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))} style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }} placeholder="Enter group description" />
            </div>
            <div style={styles.dialogActions}>
              <Dialog.Close asChild><button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button></Dialog.Close>
              <button onClick={handleCreateGroup} disabled={isSaving || !newGroup.groupName} style={{ ...styles.button, ...styles.primaryButton, opacity: isSaving || !newGroup.groupName ? 0.6 : 1 }}>
                {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                {isSaving ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit Group Dialog */}
      <Dialog.Root open={isEditGroupDialogOpen} onOpenChange={setIsEditGroupDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={styles.dialogOverlay} />
          <Dialog.Content style={styles.dialogContent}>
            <Dialog.Title style={styles.dialogTitle}>Edit Group</Dialog.Title>
            <div style={styles.formGroup}>
              <label style={styles.label}>Group Name *</label>
              <input type="text" value={editGroupData.groupName} onChange={(e) => setEditGroupData(prev => ({ ...prev, groupName: e.target.value }))} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea value={editGroupData.description} onChange={(e) => setEditGroupData(prev => ({ ...prev, description: e.target.value }))} style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }} placeholder="Enter group description" />
            </div>
            <div style={styles.dialogActions}>
              <Dialog.Close asChild><button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button></Dialog.Close>
              <button onClick={handleEditGroup} disabled={isSaving || !editGroupData.groupName} style={{ ...styles.button, ...styles.primaryButton, opacity: isSaving || !editGroupData.groupName ? 0.6 : 1 }}>
                {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Pencil size={16} />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Add Member Dialog */}
      <Dialog.Root open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={styles.dialogOverlay} />
          <Dialog.Content style={styles.dialogContent}>
            <Dialog.Title style={styles.dialogTitle}>Add Member to {selectedGroup?.groupName}</Dialog.Title>
            <div style={styles.formGroup}>
              <label style={styles.label}>Select User *</label>
              <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : '')} style={styles.select}>
                <option value="">Select a user...</option>
                {users.map(user => (
                  <option key={user.userId} value={user.userId}>
                    {user.userName} {user.firstName ? `(${user.firstName} ${user.lastName || ''})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.dialogActions}>
              <Dialog.Close asChild><button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button></Dialog.Close>
              <button onClick={handleAddMember} disabled={isSaving || !selectedUserId} style={{ ...styles.button, ...styles.primaryButton, opacity: isSaving || !selectedUserId ? 0.6 : 1 }}>
                {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <UserPlus size={16} />}
                {isSaving ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Assign Attribute to Group Dialog */}
      <Dialog.Root open={isAssignAttrDialogOpen} onOpenChange={setIsAssignAttrDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={styles.dialogOverlay} />
          <Dialog.Content style={styles.dialogContent}>
            <Dialog.Title style={styles.dialogTitle}>Assign Attribute to {selectedGroup?.groupName}</Dialog.Title>
            <div style={styles.formGroup}>
              <label style={styles.label}>Select Attribute Value *</label>
              <select value={selectedAttrId} onChange={(e) => setSelectedAttrId(e.target.value ? Number(e.target.value) : '')} style={styles.select}>
                <option value="">Select an attribute value...</option>
                {subjectAttributes.map(attr => (
                  <option key={attr.subjectAttrId} value={attr.subjectAttrId}>
                    {attr.attributeName || 'attr-' + attr.attributeId}: {attr.attributeValue}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.dialogActions}>
              <Dialog.Close asChild><button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button></Dialog.Close>
              <button onClick={handleAssignAttribute} disabled={isSaving || !selectedAttrId} style={{ ...styles.button, ...styles.primaryButton, opacity: isSaving || !selectedAttrId ? 0.6 : 1 }}>
                {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                {isSaving ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Group Confirmation */}
      <AlertDialog.Root open={deleteGroupConfirmOpen} onOpenChange={setDeleteGroupConfirmOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay style={styles.dialogOverlay} />
          <AlertDialog.Content style={styles.dialogContent}>
            <AlertDialog.Title style={styles.dialogTitle}>Delete Group</AlertDialog.Title>
            <AlertDialog.Description style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
              Are you sure you want to delete this group? All memberships and attribute assignments will be removed.
            </AlertDialog.Description>
            <div style={styles.dialogActions}>
              <AlertDialog.Cancel asChild><button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button></AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button onClick={handleDeleteGroup} disabled={isSaving} style={{ ...styles.button, ...styles.dangerButton }}>
                  {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={16} />}
                  {isSaving ? 'Deleting...' : 'Delete'}
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      {/* Remove Member Confirmation */}
      <AlertDialog.Root open={removeMemberConfirmOpen} onOpenChange={setRemoveMemberConfirmOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay style={styles.dialogOverlay} />
          <AlertDialog.Content style={styles.dialogContent}>
            <AlertDialog.Title style={styles.dialogTitle}>Remove Member</AlertDialog.Title>
            <AlertDialog.Description style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
              Are you sure you want to remove this user from the group?
            </AlertDialog.Description>
            <div style={styles.dialogActions}>
              <AlertDialog.Cancel asChild><button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button></AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button onClick={handleRemoveMember} disabled={isSaving} style={{ ...styles.button, ...styles.dangerButton }}>
                  {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={16} />}
                  {isSaving ? 'Removing...' : 'Remove'}
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      {/* Remove Attribute from Group Confirmation */}
      <AlertDialog.Root open={removeAttrConfirmOpen} onOpenChange={setRemoveAttrConfirmOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay style={styles.dialogOverlay} />
          <AlertDialog.Content style={styles.dialogContent}>
            <AlertDialog.Title style={styles.dialogTitle}>Remove Attribute</AlertDialog.Title>
            <AlertDialog.Description style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
              Are you sure you want to remove this attribute from the group?
            </AlertDialog.Description>
            <div style={styles.dialogActions}>
              <AlertDialog.Cancel asChild><button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button></AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button onClick={handleRemoveGroupAttribute} disabled={isSaving} style={{ ...styles.button, ...styles.dangerButton }}>
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
