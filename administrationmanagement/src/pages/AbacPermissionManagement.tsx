/**
 * ABAC Permission Management Page
 * Allows administrators to create and assign permissions to users using ABAC
 */

import React, { useState, useEffect, useCallback } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import {
  Users,
  Shield,
  FileText,
  Settings,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  Check,
  X,
  Loader2,
  Search,
  RefreshCw,
  AlertCircle,
  UserPlus,
  Key,
  Target,
  Zap,
  Package,
  Bookmark,
} from 'lucide-react';

import { AbacProvider, useAbacApi } from '../hooks/AbacProvider';
import {
  User,
  Policy,
  PolicyRule,
  Operation,
  Resource,
  AttributeDefinition,
  SubjectAttribute,
  CreateSubjectAttributeRequest,
  CreatePolicyRequest,
  CreatePolicyRuleRequest,
  UpdatePolicyRequest,
  UpdateOperationRequest,
  CreateResourceRequest,
  UpdateResourceRequest,
  ResourceAttribute,
  CreateResourceAttributeRequest,
  PolicyObligation,
  CreatePolicyObligationRequest,
  UpdatePolicyObligationRequest,
  RuleOperator,
  LogicalOperator,
  UserGroup,
  UserGroupMembership,
  GroupSubjectAttribute,
  UserSubjectAttribute,
} from '../services/abac-api.service';
import { commonClasses } from '../styles/styles.classes';
import '../styles/globals.css';

// ============================================================================
// Types
// ============================================================================

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

// ============================================================================
// Styles
// ============================================================================

const styles = {
  pageContainer: {
    padding: 'var(--spacing-lg)',
    backgroundColor: 'var(--color-surface)',
    minHeight: '100vh',
    fontFamily: 'var(--font-family-sans)',
  },
  maxWidth: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--spacing-lg)',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--color-text)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
  },
  tabList: {
    display: 'flex',
    borderBottom: '1px solid var(--color-border)',
    marginBottom: 'var(--spacing-lg)',
    gap: 'var(--spacing-xs)',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-xs)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 500,
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    color: 'var(--color-text-secondary)',
    transition: 'all 0.2s',
  },
  tabActive: {
    borderBottomColor: 'var(--color-primary)',
    color: 'var(--color-primary)',
  },
  card: {
    backgroundColor: 'var(--color-background)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--spacing-md)',
    borderBottom: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
  },
  cardTitle: {
    fontSize: 'var(--font-size-md)',
    fontWeight: 600,
    color: 'var(--color-text)',
  },
  cardBody: {
    padding: 'var(--spacing-md)',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-xs)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
  },
  primaryButton: {
    backgroundColor: 'var(--color-primary)',
    color: '#ffffff',
  },
  secondaryButton: {
    backgroundColor: 'var(--color-background)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
  },
  dangerButton: {
    backgroundColor: '#dc2626',
    color: '#ffffff',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    textAlign: 'left' as const,
    padding: 'var(--spacing-sm) var(--spacing-md)',
    backgroundColor: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase' as const,
  },
  td: {
    padding: 'var(--spacing-sm) var(--spacing-md)',
    borderBottom: '1px solid var(--color-border)',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text)',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: '9999px',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 500,
  },
  badgeSuccess: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  },
  badgeWarning: {
    backgroundColor: '#fef3c7',
    color: '#d97706',
  },
  badgeDanger: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },
  badgeInfo: {
    backgroundColor: '#dbeafe',
    color: '#2563eb',
  },
  searchContainer: {
    position: 'relative' as const,
    marginBottom: 'var(--spacing-md)',
  },
  searchInput: {
    width: '100%',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    paddingLeft: '2.5rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-background)',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text)',
    outline: 'none',
  },
  searchIcon: {
    position: 'absolute' as const,
    left: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--color-text-muted)',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: 'var(--spacing-xl)',
    color: 'var(--color-text-secondary)',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--spacing-xl)',
    gap: 'var(--spacing-sm)',
  },
  dialogOverlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  dialogContent: {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'var(--color-background)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--spacing-lg)',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '85vh',
    overflowY: 'auto' as const,
    zIndex: 1001,
    boxShadow: 'var(--shadow-xl)',
  },
  dialogTitle: {
    fontSize: 'var(--font-size-lg)',
    fontWeight: 600,
    color: 'var(--color-text)',
    marginBottom: 'var(--spacing-md)',
  },
  formGroup: {
    marginBottom: 'var(--spacing-md)',
  },
  label: {
    display: 'block',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 500,
    color: 'var(--color-text-secondary)',
    marginBottom: 'var(--spacing-xs)',
  },
  input: {
    width: '100%',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-background)',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text)',
    outline: 'none',
  },
  select: {
    width: '100%',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-background)',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text)',
    cursor: 'pointer',
  },
  dialogActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 'var(--spacing-sm)',
    marginTop: 'var(--spacing-lg)',
    paddingTop: 'var(--spacing-md)',
    borderTop: '1px solid var(--color-border)',
  },
  error: {
    color: '#dc2626',
    fontSize: 'var(--font-size-sm)',
    marginTop: 'var(--spacing-xs)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 'var(--spacing-md)',
  },
  actionButtons: {
    display: 'flex',
    gap: 'var(--spacing-xs)',
  },
  iconButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-background)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

// ============================================================================
// Rule Operators
// ============================================================================

const RULE_OPERATORS: { value: RuleOperator; label: string }[] = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Not Contains' },
  { value: 'in', label: 'In (comma-separated)' },
  { value: 'not_in', label: 'Not In' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'greater_than_or_equal', label: 'Greater Than or Equal' },
  { value: 'less_than_or_equal', label: 'Less Than or Equal' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
];

const LOGICAL_OPERATORS: { value: LogicalOperator; label: string }[] = [
  { value: 'AND', label: 'AND' },
  { value: 'OR', label: 'OR' },
];

// ============================================================================
// Subject Attributes Panel Component (Decoupled - standalone CRUD)
// ============================================================================

interface SubjectAttributesPanelProps {
  theme?: string;
}

function SubjectAttributesPanel({ theme }: SubjectAttributesPanelProps) {
  const api = useAbacApi();

  const [subjectAttributes, setSubjectAttributes] = useState<SubjectAttribute[]>([]);
  const [attributeDefinitions, setAttributeDefinitions] = useState<AttributeDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredAttributes = subjectAttributes.filter(attr =>
    (attr.attributeName || getAttributeDefName(attr.attributeId)).toLowerCase().includes(searchQuery.toLowerCase()) ||
    attr.attributeValue.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Loading subject attributes...</span>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={styles.cardTitle}>
          <Key size={18} style={{ marginRight: '8px', display: 'inline' }} />
          Subject Attribute Values
        </h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
          <button onClick={loadData} style={{ ...styles.button, ...styles.secondaryButton }}>
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setIsCreateDialogOpen(true)} style={{ ...styles.button, ...styles.primaryButton }}>
            <Plus size={16} />
            New Attribute Value
          </button>
        </div>
      </div>
      <div style={styles.cardBody}>
        <div style={styles.searchContainer}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search attribute values..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {error && (
          <div style={{ ...styles.badge, ...styles.badgeDanger, marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-sm)', display: 'flex', alignItems: 'center' }}>
            <AlertCircle size={16} style={{ marginRight: '8px' }} />
            {error}
          </div>
        )}

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Attribute</th>
              <th style={styles.th}>Value</th>
              <th style={styles.th}>Valid From</th>
              <th style={styles.th}>Valid Until</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttributes.map(attr => (
              <tr key={attr.subjectAttrId}>
                <td style={styles.td}>
                  <span style={{ fontWeight: 500 }}>
                    {attr.attributeName || getAttributeDefName(attr.attributeId)}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, ...styles.badgeInfo }}>
                    {attr.attributeValue}
                  </span>
                </td>
                <td style={styles.td}>
                  {attr.validFrom ? new Date(attr.validFrom).toLocaleDateString() : '-'}
                </td>
                <td style={styles.td}>
                  {attr.validUntil ? new Date(attr.validUntil).toLocaleDateString() : '-'}
                </td>
                <td style={styles.td}>
                  <div style={styles.actionButtons}>
                    <button
                      onClick={() => handleStartEdit(attr)}
                      style={{ ...styles.iconButton, color: 'var(--color-primary)' }}
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingAttributeId(attr.subjectAttrId);
                        setDeleteConfirmOpen(true);
                      }}
                      style={{ ...styles.iconButton, color: '#dc2626' }}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredAttributes.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...styles.td, ...styles.emptyState }}>
                  No subject attribute values found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

// ============================================================================
// User Permissions Panel Component (Assign attributes to users)
// ============================================================================

interface UserPermissionsPanelProps {
  theme?: string;
}

function UserPermissionsPanel({ theme }: UserPermissionsPanelProps) {
  const api = useAbacApi();

  const [users, setUsers] = useState<User[]>([]);
  const [subjectAttributes, setSubjectAttributes] = useState<SubjectAttribute[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userAttributes, setUserAttributes] = useState<SubjectAttribute[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredUsers = users.filter(user =>
    user.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Loading users...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
      {/* Users List */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>
            <Users size={18} style={{ marginRight: '8px', display: 'inline' }} />
            Users
          </h3>
          <button onClick={loadData} style={{ ...styles.button, ...styles.secondaryButton }}>
            <RefreshCw size={16} />
          </button>
        </div>
        <div style={styles.cardBody}>
          <div style={styles.searchContainer}>
            <Search size={18} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          {error && (
            <div style={{ ...styles.badge, ...styles.badgeDanger, marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-sm)', display: 'flex', alignItems: 'center' }}>
              <AlertCircle size={16} style={{ marginRight: '8px' }} />
              {error}
            </div>
          )}

          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>User</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr
                    key={user.userId}
                    onClick={() => handleSelectUser(user)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: selectedUser?.userId === user.userId ? 'var(--color-primary-light)' : 'transparent',
                    }}
                  >
                    <td style={styles.td}>
                      <div style={{ fontWeight: 500 }}>{user.userName}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name'}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...(user.userStatus === 1 ? styles.badgeSuccess : styles.badgeDanger) }}>
                        {user.userStatus === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={2} style={{ ...styles.td, ...styles.emptyState }}>
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Attribute</th>
                    <th style={styles.th}>Value</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userAttributes.map(attr => (
                    <tr key={attr.subjectAttrId}>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 500 }}>{attr.attributeName || 'Unknown'}</div>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...styles.badgeInfo }}>
                          {attr.attributeValue}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          <button
                            onClick={() => {
                              setRemovingAttrId(attr.subjectAttrId);
                              setDeleteConfirmOpen(true);
                            }}
                            style={{ ...styles.iconButton, color: '#dc2626' }}
                            title="Remove from user"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {userAttributes.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ ...styles.td, ...styles.emptyState }}>
                        No attributes assigned to this user
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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

// ============================================================================
// User Groups Panel Component
// ============================================================================

interface UserGroupsPanelProps {
  theme?: string;
}

function UserGroupsPanel({ theme }: UserGroupsPanelProps) {
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
  const [searchQuery, setSearchQuery] = useState('');

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

  // Group CRUD handlers
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

  // Membership handlers
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

  // Group attribute assignment handlers
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

  const filteredGroups = groups.filter(group =>
    group.groupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Loading groups...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
      {/* Groups List */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>
            <Users size={18} style={{ marginRight: '8px', display: 'inline' }} />
            User Groups
          </h3>
          <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
            <button onClick={loadData} style={{ ...styles.button, ...styles.secondaryButton }}>
              <RefreshCw size={16} />
            </button>
            <button onClick={() => setIsCreateGroupDialogOpen(true)} style={{ ...styles.button, ...styles.primaryButton }}>
              <Plus size={16} />
              New Group
            </button>
          </div>
        </div>
        <div style={styles.cardBody}>
          <div style={styles.searchContainer}>
            <Search size={18} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          {error && (
            <div style={{ ...styles.badge, ...styles.badgeDanger, marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-sm)', display: 'flex', alignItems: 'center' }}>
              <AlertCircle size={16} style={{ marginRight: '8px' }} />
              {error}
            </div>
          )}

          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Group</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGroups.map(group => (
                  <tr
                    key={group.groupId}
                    onClick={() => handleSelectGroup(group)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: selectedGroup?.groupId === group.groupId ? 'var(--color-primary-light)' : 'transparent',
                    }}
                  >
                    <td style={styles.td}>
                      <div style={{ fontWeight: 500 }}>{group.groupName}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        {group.description || 'No description'}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStartEditGroup(group); }}
                          style={{ ...styles.iconButton, color: 'var(--color-primary)' }}
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingGroupId(group.groupId);
                            setDeleteGroupConfirmOpen(true);
                          }}
                          style={{ ...styles.iconButton, color: '#dc2626' }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredGroups.length === 0 && (
                  <tr>
                    <td colSpan={2} style={{ ...styles.td, ...styles.emptyState }}>
                      No groups found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
              {/* Members Section */}
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)', textTransform: 'uppercase' as const }}>
                Members
              </h4>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>User</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupMembers.map(member => (
                    <tr key={member.membershipId}>
                      <td style={styles.td}>
                        <span style={{ fontWeight: 500 }}>{member.username || `User #${member.userId}`}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          <button
                            onClick={() => {
                              setRemovingMembershipId(member.membershipId);
                              setRemoveMemberConfirmOpen(true);
                            }}
                            style={{ ...styles.iconButton, color: '#dc2626' }}
                            title="Remove member"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {groupMembers.length === 0 && (
                    <tr>
                      <td colSpan={2} style={{ ...styles.td, ...styles.emptyState }}>
                        No members in this group
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Group Attributes Section */}
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-sm)', textTransform: 'uppercase' as const }}>
                Assigned Attributes
              </h4>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Attribute</th>
                    <th style={styles.th}>Value</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupAttributes.map(gsa => (
                    <tr key={gsa.id}>
                      <td style={styles.td}>
                        <span style={{ fontWeight: 500 }}>{gsa.attributeName || 'Unknown'}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...styles.badgeInfo }}>
                          {gsa.attributeValue || '-'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          <button
                            onClick={() => {
                              setRemovingGroupAttrId({ groupId: gsa.groupId, subjectAttrId: gsa.subjectAttrId });
                              setRemoveAttrConfirmOpen(true);
                            }}
                            style={{ ...styles.iconButton, color: '#dc2626' }}
                            title="Remove attribute"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {groupAttributes.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ ...styles.td, ...styles.emptyState }}>
                        No attributes assigned to this group
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
              <input
                type="text"
                value={newGroup.groupName}
                onChange={(e) => setNewGroup(prev => ({ ...prev, groupName: e.target.value }))}
                style={styles.input}
                placeholder="e.g., Workforce Viewers, HR Admins"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                value={newGroup.description}
                onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                placeholder="Enter group description"
              />
            </div>

            <div style={styles.dialogActions}>
              <Dialog.Close asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button>
              </Dialog.Close>
              <button
                onClick={handleCreateGroup}
                disabled={isSaving || !newGroup.groupName}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: isSaving || !newGroup.groupName ? 0.6 : 1,
                }}
              >
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
              <input
                type="text"
                value={editGroupData.groupName}
                onChange={(e) => setEditGroupData(prev => ({ ...prev, groupName: e.target.value }))}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                value={editGroupData.description}
                onChange={(e) => setEditGroupData(prev => ({ ...prev, description: e.target.value }))}
                style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                placeholder="Enter group description"
              />
            </div>

            <div style={styles.dialogActions}>
              <Dialog.Close asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button>
              </Dialog.Close>
              <button
                onClick={handleEditGroup}
                disabled={isSaving || !editGroupData.groupName}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: isSaving || !editGroupData.groupName ? 0.6 : 1,
                }}
              >
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
            <Dialog.Title style={styles.dialogTitle}>
              Add Member to {selectedGroup?.groupName}
            </Dialog.Title>

            <div style={styles.formGroup}>
              <label style={styles.label}>Select User *</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : '')}
                style={styles.select}
              >
                <option value="">Select a user...</option>
                {users.map(user => (
                  <option key={user.userId} value={user.userId}>
                    {user.userName} {user.firstName ? `(${user.firstName} ${user.lastName || ''})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.dialogActions}>
              <Dialog.Close asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button>
              </Dialog.Close>
              <button
                onClick={handleAddMember}
                disabled={isSaving || !selectedUserId}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: isSaving || !selectedUserId ? 0.6 : 1,
                }}
              >
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
            <Dialog.Title style={styles.dialogTitle}>
              Assign Attribute to {selectedGroup?.groupName}
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
              <AlertDialog.Cancel asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button>
              </AlertDialog.Cancel>
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
              <AlertDialog.Cancel asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button>
              </AlertDialog.Cancel>
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
              <AlertDialog.Cancel asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button>
              </AlertDialog.Cancel>
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

// ============================================================================
// Policy Management Panel Component
// ============================================================================

interface PolicyManagementPanelProps {
  theme?: string;
}

function PolicyManagementPanel({ theme }: PolicyManagementPanelProps) {
  const api = useAbacApi();

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [actions, setActions] = useState<Operation[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [attributeDefinitions, setAttributeDefinitions] = useState<AttributeDefinition[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [policyRules, setPolicyRules] = useState<PolicyRule[]>([]);
  const [policyObligations, setPolicyObligations] = useState<PolicyObligation[]>([]);
  const [policyOperations, setPolicyOperations] = useState<Operation[]>([]);
  const [policyResources, setPolicyResources] = useState<Resource[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRules, setIsLoadingRules] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isCreatePolicyDialogOpen, setIsCreatePolicyDialogOpen] = useState(false);
  const [isAddRuleDialogOpen, setIsAddRuleDialogOpen] = useState(false);
  const [isLinkActionDialogOpen, setIsLinkActionDialogOpen] = useState(false);
  const [isLinkResourceDialogOpen, setIsLinkResourceDialogOpen] = useState(false);
  const [isAddObligationDialogOpen, setIsAddObligationDialogOpen] = useState(false);
  const [isEditObligationDialogOpen, setIsEditObligationDialogOpen] = useState(false);

  const [newPolicy, setNewPolicy] = useState<Partial<CreatePolicyRequest>>({ priority: 1, policyTypeId: 1 });
  const [newRule, setNewRule] = useState<Partial<CreatePolicyRuleRequest>>({ logicalOperator: 'AND', ruleOrder: 1 });
  const [selectedActionId, setSelectedActionId] = useState<string>('');
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');
  const [newObligation, setNewObligation] = useState<Partial<CreatePolicyObligationRequest>>({ isMandatory: true });
  const [editingObligation, setEditingObligation] = useState<PolicyObligation | null>(null);
  const [editObligationData, setEditObligationData] = useState<Partial<UpdatePolicyObligationRequest>>({});

  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingPolicyId, setDeletingPolicyId] = useState<string | null>(null);
  const [deleteRuleConfirmOpen, setDeleteRuleConfirmOpen] = useState(false);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [deleteObligationConfirmOpen, setDeleteObligationConfirmOpen] = useState(false);
  const [deletingObligationId, setDeletingObligationId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [policiesData, actionsData, resourcesData, attrDefsData] = await Promise.all([
        api.getAllPolicies(),
        api.getAllOperations(),
        api.getAllResources(),
        api.getAllAttributeDefinitions(),
      ]);
      setPolicies(policiesData);
      setActions(actionsData);
      setResources(resourcesData);
      setAttributeDefinitions(attrDefsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPolicyDetails = async (policyId: string) => {
    setIsLoadingRules(true);
    try {
      const [rules, obligations, operations, linkedResources] = await Promise.all([
        api.getRulesByPolicyId(policyId),
        api.getObligationsByPolicyId(Number(policyId)),
        api.getOperationsForPolicy(policyId),
        api.getResourcesForPolicy(policyId),
      ]);
      setPolicyRules(rules);
      setPolicyObligations(obligations);
      setPolicyOperations(operations);
      setPolicyResources(linkedResources);
    } catch (err) {
      console.error('Failed to load policy details:', err);
      setPolicyRules([]);
      setPolicyObligations([]);
      setPolicyOperations([]);
      setPolicyResources([]);
    } finally {
      setIsLoadingRules(false);
    }
  };

  const handleSelectPolicy = (policy: Policy) => {
    setSelectedPolicy(policy);
    loadPolicyDetails(policy.policyId);
  };

  const handleCreatePolicy = async () => {
    if (!newPolicy.policyName || !newPolicy.policyTypeId) return;

    setIsSaving(true);
    try {
      const created = await api.createPolicy({
        policyName: newPolicy.policyName,
        policyTypeId: newPolicy.policyTypeId,
        description: newPolicy.description,
        priority: newPolicy.priority || 1,
      });
      setPolicies(prev => [...prev, created]);
      setIsCreatePolicyDialogOpen(false);
      setNewPolicy({ priority: 1, policyTypeId: 1 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create policy');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePolicy = async () => {
    if (!deletingPolicyId) return;

    setIsSaving(true);
    try {
      await api.deletePolicy(deletingPolicyId);
      setPolicies(prev => prev.filter(p => p.policyId !== deletingPolicyId));
      if (selectedPolicy?.policyId === deletingPolicyId) {
        setSelectedPolicy(null);
        setPolicyRules([]);
        setPolicyObligations([]);
        setPolicyOperations([]);
        setPolicyResources([]);
      }
      setDeleteConfirmOpen(false);
      setDeletingPolicyId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete policy');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddRule = async () => {
    if (!selectedPolicy || !newRule.attributeId || !newRule.operator || !newRule.comparisonValue) return;

    setIsSaving(true);
    try {
      const created = await api.createPolicyRule({
        policyId: selectedPolicy.policyId,
        attributeId: newRule.attributeId,
        operator: newRule.operator as RuleOperator,
        comparisonValue: newRule.comparisonValue,
        logicalOperator: newRule.logicalOperator as LogicalOperator,
        ruleOrder: newRule.ruleOrder || policyRules.length + 1,
      });
      setPolicyRules(prev => [...prev, created]);
      setIsAddRuleDialogOpen(false);
      setNewRule({ logicalOperator: 'AND', ruleOrder: policyRules.length + 2 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add rule');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRule = async () => {
    if (!deletingRuleId) return;

    setIsSaving(true);
    try {
      await api.deletePolicyRule(deletingRuleId);
      setPolicyRules(prev => prev.filter(r => r.ruleId !== deletingRuleId));
      setDeleteRuleConfirmOpen(false);
      setDeletingRuleId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete rule');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLinkAction = async () => {
    if (!selectedPolicy || !selectedActionId) return;

    setIsSaving(true);
    try {
      await api.addActionToPolicy(selectedPolicy.policyId, selectedActionId);
      setIsLinkActionDialogOpen(false);
      setSelectedActionId('');
      loadPolicyDetails(selectedPolicy.policyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link action');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLinkResource = async () => {
    if (!selectedPolicy || !selectedResourceId) return;

    setIsSaving(true);
    try {
      await api.addResourceToPolicy(selectedPolicy.policyId, selectedResourceId);
      setIsLinkResourceDialogOpen(false);
      setSelectedResourceId('');
      loadPolicyDetails(selectedPolicy.policyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link resource');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnlinkAction = async (operationId: string) => {
    if (!selectedPolicy) return;

    try {
      await api.removeActionFromPolicy(selectedPolicy.policyId, operationId);
      loadPolicyDetails(selectedPolicy.policyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink action');
    }
  };

  const handleUnlinkResource = async (resourceId: string) => {
    if (!selectedPolicy) return;

    try {
      await api.removeResourceFromPolicy(selectedPolicy.policyId, resourceId);
      loadPolicyDetails(selectedPolicy.policyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink resource');
    }
  };

  const handleAddObligation = async () => {
    if (!selectedPolicy || !newObligation.obligationTypeId) return;

    setIsSaving(true);
    try {
      const created = await api.createPolicyObligation({
        policyId: Number(selectedPolicy.policyId),
        obligationTypeId: newObligation.obligationTypeId,
        obligationParams: newObligation.obligationParams,
        isMandatory: newObligation.isMandatory,
      });
      setPolicyObligations(prev => [...prev, created]);
      setIsAddObligationDialogOpen(false);
      setNewObligation({ isMandatory: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add obligation');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEditObligation = (obligation: PolicyObligation) => {
    setEditingObligation(obligation);
    setEditObligationData({
      obligationTypeId: obligation.obligationTypeId,
      obligationParams: obligation.obligationParams,
      isMandatory: obligation.isMandatory,
    });
    setIsEditObligationDialogOpen(true);
  };

  const handleEditObligation = async () => {
    if (!editingObligation || !editObligationData.obligationTypeId) return;

    setIsSaving(true);
    try {
      const updated = await api.updatePolicyObligation(editingObligation.obligationId, {
        obligationTypeId: editObligationData.obligationTypeId,
        obligationParams: editObligationData.obligationParams,
        isMandatory: editObligationData.isMandatory,
      });
      setPolicyObligations(prev => prev.map(o => o.obligationId === editingObligation.obligationId ? updated : o));
      setIsEditObligationDialogOpen(false);
      setEditingObligation(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update obligation');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteObligation = async () => {
    if (deletingObligationId === null) return;

    setIsSaving(true);
    try {
      await api.deletePolicyObligation(deletingObligationId);
      setPolicyObligations(prev => prev.filter(o => o.obligationId !== deletingObligationId));
      setDeleteObligationConfirmOpen(false);
      setDeletingObligationId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete obligation');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPolicies = policies.filter(policy =>
    policy.policyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    policy.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAttributeName = (attrDefId: string) => {
    const def = attributeDefinitions.find(d => d.attributeId === attrDefId);
    return def?.attributeName || 'Unknown';
  };

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Loading policies...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
      {/* Policies List */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>
            <Shield size={18} style={{ marginRight: '8px', display: 'inline' }} />
            Policies
          </h3>
          <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
            <button
              onClick={loadData}
              style={{ ...styles.button, ...styles.secondaryButton }}
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => setIsCreatePolicyDialogOpen(true)}
              style={{ ...styles.button, ...styles.primaryButton }}
            >
              <Plus size={16} />
              New Policy
            </button>
          </div>
        </div>
        <div style={styles.cardBody}>
          <div style={styles.searchContainer}>
            <Search size={18} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search policies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          {error && (
            <div style={{ ...styles.badge, ...styles.badgeDanger, marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-sm)', display: 'flex', alignItems: 'center' }}>
              <AlertCircle size={16} style={{ marginRight: '8px' }} />
              {error}
            </div>
          )}

          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Policy</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Priority</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPolicies.map(policy => (
                  <tr
                    key={policy.policyId}
                    onClick={() => handleSelectPolicy(policy)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: selectedPolicy?.policyId === policy.policyId ? 'var(--color-primary-light)' : 'transparent',
                    }}
                  >
                    <td style={styles.td}>
                      <div style={{ fontWeight: 500 }}>{policy.policyName}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        {policy.description || 'No description'}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...(policy.policyTypeName === 'PERMIT' ? styles.badgeSuccess : styles.badgeDanger) }}>
                        {policy.policyTypeName}
                      </span>
                    </td>
                    <td style={styles.td}>{policy.priority}</td>
                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingPolicyId(policy.policyId);
                            setDeleteConfirmOpen(true);
                          }}
                          style={{ ...styles.iconButton, color: '#dc2626' }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPolicies.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ ...styles.td, ...styles.emptyState }}>
                      No policies found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Policy Details (Rules + Obligations) */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>
            <FileText size={18} style={{ marginRight: '8px', display: 'inline' }} />
            {selectedPolicy ? selectedPolicy.policyName : 'Select a Policy'}
          </h3>
          {selectedPolicy && (
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap' as const }}>
              <button
                onClick={() => setIsLinkActionDialogOpen(true)}
                style={{ ...styles.button, ...styles.secondaryButton }}
                title="Link Action"
              >
                <Zap size={16} />
                Link Action
              </button>
              <button
                onClick={() => setIsLinkResourceDialogOpen(true)}
                style={{ ...styles.button, ...styles.secondaryButton }}
                title="Link Resource"
              >
                <Target size={16} />
                Link Resource
              </button>
              <button
                onClick={() => setIsAddRuleDialogOpen(true)}
                style={{ ...styles.button, ...styles.primaryButton }}
              >
                <Plus size={16} />
                Add Rule
              </button>
            </div>
          )}
        </div>
        <div style={styles.cardBody}>
          {!selectedPolicy ? (
            <div style={styles.emptyState}>
              <Shield size={48} style={{ marginBottom: 'var(--spacing-md)', opacity: 0.5 }} />
              <p>Select a policy to view and manage its rules and obligations</p>
            </div>
          ) : isLoadingRules ? (
            <div style={styles.loadingContainer}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Loading policy details...</span>
            </div>
          ) : (
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {/* Rules Section */}
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)', textTransform: 'uppercase' as const }}>
                Rules
              </h4>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Order</th>
                    <th style={styles.th}>Attribute</th>
                    <th style={styles.th}>Operator</th>
                    <th style={styles.th}>Value</th>
                    <th style={styles.th}>Logic</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {policyRules.sort((a, b) => a.ruleOrder - b.ruleOrder).map(rule => (
                    <tr key={rule.ruleId}>
                      <td style={styles.td}>{rule.ruleOrder}</td>
                      <td style={styles.td}>
                        <span style={{ fontWeight: 500 }}>
                          {rule.attributeName || getAttributeName(rule.attributeId)}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...styles.badgeInfo }}>
                          {rule.operator}
                        </span>
                      </td>
                      <td style={styles.td}>{rule.comparisonValue}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...styles.badgeWarning }}>
                          {rule.logicalOperator}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          <button
                            onClick={() => {
                              setDeletingRuleId(rule.ruleId);
                              setDeleteRuleConfirmOpen(true);
                            }}
                            style={{ ...styles.iconButton, color: '#dc2626' }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {policyRules.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ ...styles.td, ...styles.emptyState }}>
                        No rules defined for this policy
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Linked Actions Section */}
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-sm)', textTransform: 'uppercase' as const }}>
                Linked Actions
              </h4>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Description</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {policyOperations.map(op => (
                    <tr key={op.operationId}>
                      <td style={styles.td}>
                        <span style={{ fontWeight: 500 }}>{op.operationName}</span>
                      </td>
                      <td style={styles.td}>{op.description || '-'}</td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          <button
                            onClick={() => handleUnlinkAction(op.operationId)}
                            style={{ ...styles.iconButton, color: '#dc2626' }}
                            title="Unlink Action"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {policyOperations.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ ...styles.td, ...styles.emptyState }}>
                        No actions linked to this policy
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Linked Resources Section */}
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-sm)', textTransform: 'uppercase' as const }}>
                Linked Resources
              </h4>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {policyResources.map(res => (
                    <tr key={res.resourceId}>
                      <td style={styles.td}>
                        <span style={{ fontWeight: 500 }}>{res.resourceName}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...styles.badgeInfo }}>
                          {res.resourceTypeName}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          <button
                            onClick={() => handleUnlinkResource(res.resourceId)}
                            style={{ ...styles.iconButton, color: '#dc2626' }}
                            title="Unlink Resource"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {policyResources.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ ...styles.td, ...styles.emptyState }}>
                        No resources linked to this policy
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Obligations Section */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-sm)' }}>
                <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' as const }}>
                  Obligations
                </h4>
                <button
                  onClick={() => setIsAddObligationDialogOpen(true)}
                  style={{ ...styles.button, ...styles.primaryButton }}
                >
                  <Plus size={16} />
                  Add Obligation
                </button>
              </div>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Parameters</th>
                    <th style={styles.th}>Mandatory</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {policyObligations.map(obligation => (
                    <tr key={obligation.obligationId}>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...styles.badgeInfo }}>
                          {obligation.obligationTypeName}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ fontSize: 'var(--font-size-xs)', fontFamily: 'monospace' }}>
                          {obligation.obligationParams
                            ? (obligation.obligationParams.length > 60
                              ? obligation.obligationParams.substring(0, 60) + '...'
                              : obligation.obligationParams)
                            : '-'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...(obligation.isMandatory ? styles.badgeSuccess : styles.badgeWarning) }}>
                          {obligation.isMandatory ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          <button
                            onClick={() => handleStartEditObligation(obligation)}
                            style={{ ...styles.iconButton, color: 'var(--color-primary)' }}
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingObligationId(obligation.obligationId);
                              setDeleteObligationConfirmOpen(true);
                            }}
                            style={{ ...styles.iconButton, color: '#dc2626' }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {policyObligations.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ ...styles.td, ...styles.emptyState }}>
                        No obligations defined for this policy
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Policy Dialog */}
      <Dialog.Root open={isCreatePolicyDialogOpen} onOpenChange={setIsCreatePolicyDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={styles.dialogOverlay} />
          <Dialog.Content style={styles.dialogContent}>
            <Dialog.Title style={styles.dialogTitle}>
              Create New Policy
            </Dialog.Title>

            <div style={styles.formGroup}>
              <label style={styles.label}>Policy Name *</label>
              <input
                type="text"
                value={newPolicy.policyName || ''}
                onChange={(e) => setNewPolicy(prev => ({ ...prev, policyName: e.target.value }))}
                style={styles.input}
                placeholder="Enter policy name"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Policy Type *</label>
              <select
                value={newPolicy.policyTypeId || 1}
                onChange={(e) => setNewPolicy(prev => ({ ...prev, policyTypeId: Number(e.target.value) }))}
                style={styles.select}
              >
                <option value={1}>PERMIT</option>
                <option value={2}>DENY</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Priority</label>
              <input
                type="number"
                value={newPolicy.priority || 1}
                onChange={(e) => setNewPolicy(prev => ({ ...prev, priority: Number(e.target.value) }))}
                style={styles.input}
                min={1}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                value={newPolicy.description || ''}
                onChange={(e) => setNewPolicy(prev => ({ ...prev, description: e.target.value }))}
                style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                placeholder="Enter policy description"
              />
            </div>

            <div style={styles.dialogActions}>
              <Dialog.Close asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleCreatePolicy}
                disabled={isSaving || !newPolicy.policyName}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: isSaving || !newPolicy.policyName ? 0.6 : 1,
                }}
              >
                {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                {isSaving ? 'Creating...' : 'Create Policy'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Add Rule Dialog */}
      <Dialog.Root open={isAddRuleDialogOpen} onOpenChange={setIsAddRuleDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={styles.dialogOverlay} />
          <Dialog.Content style={styles.dialogContent}>
            <Dialog.Title style={styles.dialogTitle}>
              Add Rule to {selectedPolicy?.policyName}
            </Dialog.Title>

            <div style={styles.formGroup}>
              <label style={styles.label}>Attribute *</label>
              <select
                value={newRule.attributeId || ''}
                onChange={(e) => setNewRule(prev => ({ ...prev, attributeId: e.target.value }))}
                style={styles.select}
              >
                <option value="">Select an attribute...</option>
                {attributeDefinitions.map(def => (
                  <option key={def.attributeId} value={def.attributeId}>
                    {def.attributeName} ({def.attributeCategoryName})
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Operator *</label>
              <select
                value={newRule.operator || ''}
                onChange={(e) => setNewRule(prev => ({ ...prev, operator: e.target.value as RuleOperator }))}
                style={styles.select}
              >
                <option value="">Select an operator...</option>
                {RULE_OPERATORS.map(op => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Comparison Value *</label>
              <input
                type="text"
                value={newRule.comparisonValue || ''}
                onChange={(e) => setNewRule(prev => ({ ...prev, comparisonValue: e.target.value }))}
                style={styles.input}
                placeholder="Enter value to compare"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Logical Operator</label>
              <select
                value={newRule.logicalOperator || 'AND'}
                onChange={(e) => setNewRule(prev => ({ ...prev, logicalOperator: e.target.value as LogicalOperator }))}
                style={styles.select}
              >
                {LOGICAL_OPERATORS.map(op => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Rule Order</label>
              <input
                type="number"
                value={newRule.ruleOrder || policyRules.length + 1}
                onChange={(e) => setNewRule(prev => ({ ...prev, ruleOrder: Number(e.target.value) }))}
                style={styles.input}
                min={1}
              />
            </div>

            <div style={styles.dialogActions}>
              <Dialog.Close asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleAddRule}
                disabled={isSaving || !newRule.attributeId || !newRule.operator || !newRule.comparisonValue}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: isSaving || !newRule.attributeId || !newRule.operator || !newRule.comparisonValue ? 0.6 : 1,
                }}
              >
                {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                {isSaving ? 'Adding...' : 'Add Rule'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Link Action Dialog */}
      <Dialog.Root open={isLinkActionDialogOpen} onOpenChange={setIsLinkActionDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={styles.dialogOverlay} />
          <Dialog.Content style={styles.dialogContent}>
            <Dialog.Title style={styles.dialogTitle}>
              Link Action to {selectedPolicy?.policyName}
            </Dialog.Title>

            <div style={styles.formGroup}>
              <label style={styles.label}>Select Action *</label>
              <select
                value={selectedActionId}
                onChange={(e) => setSelectedActionId(e.target.value)}
                style={styles.select}
              >
                <option value="">Select an action...</option>
                {actions.map(action => (
                  <option key={action.operationId} value={action.operationId}>
                    {action.operationName} - {action.description || 'No description'}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.dialogActions}>
              <Dialog.Close asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleLinkAction}
                disabled={isSaving || !selectedActionId}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: isSaving || !selectedActionId ? 0.6 : 1,
                }}
              >
                {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={16} />}
                {isSaving ? 'Linking...' : 'Link Action'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Link Resource Dialog */}
      <Dialog.Root open={isLinkResourceDialogOpen} onOpenChange={setIsLinkResourceDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={styles.dialogOverlay} />
          <Dialog.Content style={styles.dialogContent}>
            <Dialog.Title style={styles.dialogTitle}>
              Link Resource to {selectedPolicy?.policyName}
            </Dialog.Title>

            <div style={styles.formGroup}>
              <label style={styles.label}>Select Resource *</label>
              <select
                value={selectedResourceId}
                onChange={(e) => setSelectedResourceId(e.target.value)}
                style={styles.select}
              >
                <option value="">Select a resource...</option>
                {resources.map(resource => (
                  <option key={resource.resourceId} value={resource.resourceId}>
                    {resource.resourceName} ({resource.resourceTypeName})
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.dialogActions}>
              <Dialog.Close asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleLinkResource}
                disabled={isSaving || !selectedResourceId}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: isSaving || !selectedResourceId ? 0.6 : 1,
                }}
              >
                {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Target size={16} />}
                {isSaving ? 'Linking...' : 'Link Resource'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Policy Confirmation */}
      <AlertDialog.Root open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay style={styles.dialogOverlay} />
          <AlertDialog.Content style={styles.dialogContent}>
            <AlertDialog.Title style={styles.dialogTitle}>
              Delete Policy
            </AlertDialog.Title>
            <AlertDialog.Description style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
              Are you sure you want to delete this policy? All associated rules will also be deleted. This action cannot be undone.
            </AlertDialog.Description>
            <div style={styles.dialogActions}>
              <AlertDialog.Cancel asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>
                  Cancel
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  onClick={handleDeletePolicy}
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

      {/* Delete Rule Confirmation */}
      <AlertDialog.Root open={deleteRuleConfirmOpen} onOpenChange={setDeleteRuleConfirmOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay style={styles.dialogOverlay} />
          <AlertDialog.Content style={styles.dialogContent}>
            <AlertDialog.Title style={styles.dialogTitle}>
              Delete Rule
            </AlertDialog.Title>
            <AlertDialog.Description style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
              Are you sure you want to delete this rule? This action cannot be undone.
            </AlertDialog.Description>
            <div style={styles.dialogActions}>
              <AlertDialog.Cancel asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>
                  Cancel
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  onClick={handleDeleteRule}
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

      {/* Add Obligation Dialog */}
      <Dialog.Root open={isAddObligationDialogOpen} onOpenChange={setIsAddObligationDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={styles.dialogOverlay} />
          <Dialog.Content style={styles.dialogContent}>
            <Dialog.Title style={styles.dialogTitle}>
              Add Obligation to {selectedPolicy?.policyName}
            </Dialog.Title>

            <div style={styles.formGroup}>
              <label style={styles.label}>Obligation Type *</label>
              <select
                value={newObligation.obligationTypeId || ''}
                onChange={(e) => setNewObligation(prev => ({ ...prev, obligationTypeId: Number(e.target.value) }))}
                style={styles.select}
              >
                <option value="">Select a type...</option>
                <option value={1}>log_access</option>
                <option value={2}>notify_admin</option>
                <option value={3}>encrypt_data</option>
                <option value={4}>audit_trail</option>
                <option value={5}>rate_limit</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Parameters (JSON)</label>
              <textarea
                value={newObligation.obligationParams || ''}
                onChange={(e) => setNewObligation(prev => ({ ...prev, obligationParams: e.target.value }))}
                style={{ ...styles.input, minHeight: '100px', resize: 'vertical' as const, fontFamily: 'monospace' }}
                placeholder='{"message": "Access logged", "severity": "info"}'
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Mandatory</label>
              <select
                value={newObligation.isMandatory ? 'true' : 'false'}
                onChange={(e) => setNewObligation(prev => ({ ...prev, isMandatory: e.target.value === 'true' }))}
                style={styles.select}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div style={styles.dialogActions}>
              <Dialog.Close asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleAddObligation}
                disabled={isSaving || !newObligation.obligationTypeId}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: isSaving || !newObligation.obligationTypeId ? 0.6 : 1,
                }}
              >
                {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                {isSaving ? 'Adding...' : 'Add Obligation'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit Obligation Dialog */}
      <Dialog.Root open={isEditObligationDialogOpen} onOpenChange={setIsEditObligationDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={styles.dialogOverlay} />
          <Dialog.Content style={styles.dialogContent}>
            <Dialog.Title style={styles.dialogTitle}>
              Edit Obligation
            </Dialog.Title>

            <div style={styles.formGroup}>
              <label style={styles.label}>Obligation Type *</label>
              <select
                title="Obligation Type"
                value={editObligationData.obligationTypeId || ''}
                onChange={(e) => setEditObligationData(prev => ({ ...prev, obligationTypeId: Number(e.target.value) }))}
                style={styles.select}
              >
                <option value="">Select a type...</option>
                <option value={1}>log_access</option>
                <option value={2}>notify_admin</option>
                <option value={3}>encrypt_data</option>
                <option value={4}>audit_trail</option>
                <option value={5}>rate_limit</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Parameters (JSON)</label>
              <textarea
                value={editObligationData.obligationParams || ''}
                onChange={(e) => setEditObligationData(prev => ({ ...prev, obligationParams: e.target.value }))}
                style={{ ...styles.input, minHeight: '100px', resize: 'vertical' as const, fontFamily: 'monospace' }}
                placeholder='{"message": "Access logged", "severity": "info"}'
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Mandatory</label>
              <select
                title="Mandatory"
                value={editObligationData.isMandatory ? 'true' : 'false'}
                onChange={(e) => setEditObligationData(prev => ({ ...prev, isMandatory: e.target.value === 'true' }))}
                style={styles.select}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div style={styles.dialogActions}>
              <Dialog.Close asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleEditObligation}
                disabled={isSaving || !editObligationData.obligationTypeId}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: isSaving || !editObligationData.obligationTypeId ? 0.6 : 1,
                }}
              >
                {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Pencil size={16} />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Obligation Confirmation */}
      <AlertDialog.Root open={deleteObligationConfirmOpen} onOpenChange={setDeleteObligationConfirmOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay style={styles.dialogOverlay} />
          <AlertDialog.Content style={styles.dialogContent}>
            <AlertDialog.Title style={styles.dialogTitle}>
              Delete Obligation
            </AlertDialog.Title>
            <AlertDialog.Description style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
              Are you sure you want to delete this obligation? This action cannot be undone.
            </AlertDialog.Description>
            <div style={styles.dialogActions}>
              <AlertDialog.Cancel asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>
                  Cancel
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  onClick={handleDeleteObligation}
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

// ============================================================================
// Actions Management Panel Component
// ============================================================================

interface ActionsManagementPanelProps {
  theme?: string;
}

function ActionsManagementPanel({ theme }: ActionsManagementPanelProps) {
  const api = useAbacApi();

  const [actions, setActions] = useState<Operation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newAction, setNewAction] = useState<{ actionName: string; description: string }>({ actionName: '', description: '' });
  const [editingAction, setEditingAction] = useState<Operation | null>(null);
  const [editActionData, setEditActionData] = useState<{ operationName: string; description: string }>({ operationName: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingActionId, setDeletingActionId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getAllOperations();
      setActions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load actions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newAction.actionName) return;

    setIsSaving(true);
    try {
      const created = await api.createOperation({
        operationName: newAction.actionName,
        description: newAction.description,
      });
      setActions(prev => [...prev, created]);
      setIsCreateDialogOpen(false);
      setNewAction({ actionName: '', description: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create action');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingActionId) return;

    setIsSaving(true);
    try {
      await api.deleteOperation(deletingActionId);
      setActions(prev => prev.filter(a => a.operationId !== deletingActionId));
      setDeleteConfirmOpen(false);
      setDeletingActionId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete action');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = (action: Operation) => {
    setEditingAction(action);
    setEditActionData({ operationName: action.operationName, description: action.description || '' });
    setIsEditDialogOpen(true);
  };

  const handleEditAction = async () => {
    if (!editingAction || !editActionData.operationName) return;

    setIsSaving(true);
    try {
      const updated = await api.updateOperation(editingAction.operationId, {
        operationName: editActionData.operationName,
        description: editActionData.description,
      });
      setActions(prev => prev.map(a => a.operationId === editingAction.operationId ? updated : a));
      setIsEditDialogOpen(false);
      setEditingAction(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update action');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredActions = actions.filter(action =>
    action.operationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    action.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Loading actions...</span>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={styles.cardTitle}>
          <Zap size={18} style={{ marginRight: '8px', display: 'inline' }} />
          Actions
        </h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
          <button
            onClick={loadData}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            <Plus size={16} />
            New Action
          </button>
        </div>
      </div>
      <div style={styles.cardBody}>
        <div style={styles.searchContainer}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {error && (
          <div style={{ ...styles.badge, ...styles.badgeDanger, marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-sm)', display: 'flex', alignItems: 'center' }}>
            <AlertCircle size={16} style={{ marginRight: '8px' }} />
            {error}
          </div>
        )}

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Action Name</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Created</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredActions.map(action => (
              <tr key={action.operationId}>
                <td style={styles.td}>
                  <span style={{ fontWeight: 500 }}>{action.operationName}</span>
                </td>
                <td style={styles.td}>{action.description || '-'}</td>
                <td style={styles.td}>
                  {new Date(action.createdAt).toLocaleDateString()}
                </td>
                <td style={styles.td}>
                  <div style={styles.actionButtons}>
                    <button
                      onClick={() => handleStartEdit(action)}
                      style={{ ...styles.iconButton, color: 'var(--color-primary)' }}
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingActionId(action.operationId);
                        setDeleteConfirmOpen(true);
                      }}
                      style={{ ...styles.iconButton, color: '#dc2626' }}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredActions.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...styles.td, ...styles.emptyState }}>
                  No actions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Action Dialog */}
      <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={styles.dialogOverlay} />
          <Dialog.Content style={styles.dialogContent}>
            <Dialog.Title style={styles.dialogTitle}>
              Create New Action
            </Dialog.Title>

            <div style={styles.formGroup}>
              <label style={styles.label}>Action Name *</label>
              <input
                type="text"
                value={newAction.actionName}
                onChange={(e) => setNewAction(prev => ({ ...prev, actionName: e.target.value }))}
                style={styles.input}
                placeholder="e.g., read, write, delete, execute"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                value={newAction.description}
                onChange={(e) => setNewAction(prev => ({ ...prev, description: e.target.value }))}
                style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                placeholder="Enter action description"
              />
            </div>

            <div style={styles.dialogActions}>
              <Dialog.Close asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleCreate}
                disabled={isSaving || !newAction.actionName}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: isSaving || !newAction.actionName ? 0.6 : 1,
                }}
              >
                {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                {isSaving ? 'Creating...' : 'Create Action'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit Action Dialog */}
      <Dialog.Root open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={styles.dialogOverlay} />
          <Dialog.Content style={styles.dialogContent}>
            <Dialog.Title style={styles.dialogTitle}>
              Edit Action
            </Dialog.Title>

            <div style={styles.formGroup}>
              <label style={styles.label}>Action Name *</label>
              <input
                type="text"
                value={editActionData.operationName}
                onChange={(e) => setEditActionData(prev => ({ ...prev, operationName: e.target.value }))}
                style={styles.input}
                placeholder="e.g., read, write, delete, execute"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                value={editActionData.description}
                onChange={(e) => setEditActionData(prev => ({ ...prev, description: e.target.value }))}
                style={{ ...styles.input, minHeight: '80px', resize: 'vertical' as const }}
                placeholder="Enter action description"
              />
            </div>

            <div style={styles.dialogActions}>
              <Dialog.Close asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleEditAction}
                disabled={isSaving || !editActionData.operationName}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: isSaving || !editActionData.operationName ? 0.6 : 1,
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
            <AlertDialog.Title style={styles.dialogTitle}>
              Delete Action
            </AlertDialog.Title>
            <AlertDialog.Description style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
              Are you sure you want to delete this action? This may affect policies that reference it.
            </AlertDialog.Description>
            <div style={styles.dialogActions}>
              <AlertDialog.Cancel asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>
                  Cancel
                </button>
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

// ============================================================================
// Resources Management Panel Component
// ============================================================================

interface ResourcesManagementPanelProps {
  theme?: string;
}

function ResourcesManagementPanel({ theme }: ResourcesManagementPanelProps) {
  const api = useAbacApi();

  // Resources state
  const [resources, setResources] = useState<Resource[]>([]);
  const [attributeDefinitions, setAttributeDefinitions] = useState<AttributeDefinition[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [resourceAttributes, setResourceAttributes] = useState<ResourceAttribute[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Resource CRUD dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newResource, setNewResource] = useState<{ resourceName: string; resourceTypeId: number }>({ resourceName: '', resourceTypeId: 1 });
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [editResourceData, setEditResourceData] = useState<{ resourceName: string; resourceTypeId: number }>({ resourceName: '', resourceTypeId: 1 });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);

  // Resource Attribute dialogs
  const [isAddAttributeDialogOpen, setIsAddAttributeDialogOpen] = useState(false);
  const [newAttribute, setNewAttribute] = useState<Partial<CreateResourceAttributeRequest>>({});
  const [deleteAttrConfirmOpen, setDeleteAttrConfirmOpen] = useState(false);
  const [deletingAttrId, setDeletingAttrId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [resourcesData, attrDefsData] = await Promise.all([
        api.getAllResources(),
        api.getAllAttributeDefinitions(),
      ]);
      setResources(resourcesData);
      setAttributeDefinitions(attrDefsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadResourceAttributes = async (resourceId: string) => {
    setIsLoadingAttributes(true);
    try {
      const attrs = await api.getResourceAttributesByResourceId(resourceId);
      setResourceAttributes(attrs);
    } catch (err) {
      console.error('Failed to load resource attributes:', err);
      setResourceAttributes([]);
    } finally {
      setIsLoadingAttributes(false);
    }
  };

  const handleSelectResource = (resource: Resource) => {
    setSelectedResource(resource);
    loadResourceAttributes(resource.resourceId);
  };

  const handleCreate = async () => {
    if (!newResource.resourceName) return;

    setIsSaving(true);
    try {
      const created = await api.createResource({
        resourceName: newResource.resourceName,
        resourceTypeId: newResource.resourceTypeId,
      });
      setResources(prev => [...prev, created]);
      setIsCreateDialogOpen(false);
      setNewResource({ resourceName: '', resourceTypeId: 1 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create resource');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingResourceId) return;

    setIsSaving(true);
    try {
      await api.deleteResource(deletingResourceId);
      setResources(prev => prev.filter(r => r.resourceId !== deletingResourceId));
      if (selectedResource?.resourceId === deletingResourceId) {
        setSelectedResource(null);
        setResourceAttributes([]);
      }
      setDeleteConfirmOpen(false);
      setDeletingResourceId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete resource');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = (resource: Resource) => {
    setEditingResource(resource);
    setEditResourceData({ resourceName: resource.resourceName, resourceTypeId: resource.resourceTypeId });
    setIsEditDialogOpen(true);
  };

  const handleEditResource = async () => {
    if (!editingResource || !editResourceData.resourceName) return;

    setIsSaving(true);
    try {
      const updated = await api.updateResource(editingResource.resourceId, {
        resourceName: editResourceData.resourceName,
        resourceTypeId: editResourceData.resourceTypeId,
      });
      setResources(prev => prev.map(r => r.resourceId === editingResource.resourceId ? updated : r));
      if (selectedResource?.resourceId === editingResource.resourceId) {
        setSelectedResource(updated);
      }
      setIsEditDialogOpen(false);
      setEditingResource(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update resource');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAttribute = async () => {
    if (!selectedResource || !newAttribute.attributeId || !newAttribute.attributeValue) return;

    setIsSaving(true);
    try {
      const created = await api.createResourceAttribute({
        resourceId: selectedResource.resourceId,
        attributeId: newAttribute.attributeId,
        attributeValue: newAttribute.attributeValue,
        effectiveFrom: newAttribute.effectiveFrom,
        effectiveTo: newAttribute.effectiveTo,
      });
      setResourceAttributes(prev => [...prev, created]);
      setIsAddAttributeDialogOpen(false);
      setNewAttribute({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add attribute');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAttribute = async () => {
    if (!deletingAttrId) return;

    setIsSaving(true);
    try {
      await api.deleteResourceAttribute(deletingAttrId);
      setResourceAttributes(prev => prev.filter(a => a.resourceAttributeId !== deletingAttrId));
      setDeleteAttrConfirmOpen(false);
      setDeletingAttrId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete attribute');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredResources = resources.filter(resource =>
    resource.resourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.resourceTypeName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAttributeName = (attrDefId: string) => {
    const def = attributeDefinitions.find(d => d.attributeId === attrDefId);
    return def?.attributeName || 'Unknown';
  };

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Loading resources...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
      {/* Resources List */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>
            <Package size={18} style={{ marginRight: '8px', display: 'inline' }} />
            Resources
          </h3>
          <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
            <button
              onClick={loadData}
              style={{ ...styles.button, ...styles.secondaryButton }}
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              style={{ ...styles.button, ...styles.primaryButton }}
            >
              <Plus size={16} />
              New Resource
            </button>
          </div>
        </div>
        <div style={styles.cardBody}>
          <div style={styles.searchContainer}>
            <Search size={18} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          {error && (
            <div style={{ ...styles.badge, ...styles.badgeDanger, marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-sm)', display: 'flex', alignItems: 'center' }}>
              <AlertCircle size={16} style={{ marginRight: '8px' }} />
              {error}
            </div>
          )}

          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Resource</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResources.map(resource => (
                  <tr
                    key={resource.resourceId}
                    onClick={() => handleSelectResource(resource)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: selectedResource?.resourceId === resource.resourceId ? 'var(--color-primary-light)' : 'transparent',
                    }}
                  >
                    <td style={styles.td}>
                      <div style={{ fontWeight: 500 }}>{resource.resourceName}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        {new Date(resource.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...styles.badgeInfo }}>
                        {resource.resourceTypeName}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...(resource.isActive ? styles.badgeSuccess : styles.badgeDanger) }}>
                        {resource.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStartEdit(resource); }}
                          style={{ ...styles.iconButton, color: 'var(--color-primary)' }}
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingResourceId(resource.resourceId);
                            setDeleteConfirmOpen(true);
                          }}
                          style={{ ...styles.iconButton, color: '#dc2626' }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredResources.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ ...styles.td, ...styles.emptyState }}>
                      No resources found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Resource Attributes */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>
            <Key size={18} style={{ marginRight: '8px', display: 'inline' }} />
            {selectedResource ? `Attributes for ${selectedResource.resourceName}` : 'Select a Resource'}
          </h3>
          {selectedResource && (
            <button
              onClick={() => setIsAddAttributeDialogOpen(true)}
              style={{ ...styles.button, ...styles.primaryButton }}
            >
              <Plus size={16} />
              Add Attribute
            </button>
          )}
        </div>
        <div style={styles.cardBody}>
          {!selectedResource ? (
            <div style={styles.emptyState}>
              <Package size={48} style={{ marginBottom: 'var(--spacing-md)', opacity: 0.5 }} />
              <p>Select a resource to view and manage its attributes</p>
            </div>
          ) : isLoadingAttributes ? (
            <div style={styles.loadingContainer}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Loading attributes...</span>
            </div>
          ) : (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Attribute</th>
                    <th style={styles.th}>Value</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resourceAttributes.map(attr => (
                    <tr key={attr.resourceAttributeId}>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 500 }}>
                          {attr.attributeName || getAttributeName(attr.attributeId)}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...styles.badgeInfo }}>
                          {attr.attributeValue}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...(attr.isActive ? styles.badgeSuccess : styles.badgeDanger) }}>
                          {attr.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          <button
                            onClick={() => {
                              setDeletingAttrId(attr.resourceAttributeId);
                              setDeleteAttrConfirmOpen(true);
                            }}
                            style={{ ...styles.iconButton, color: '#dc2626' }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {resourceAttributes.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ ...styles.td, ...styles.emptyState }}>
                        No attributes assigned to this resource
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Resource Dialog */}
      <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={styles.dialogOverlay} />
          <Dialog.Content style={styles.dialogContent}>
            <Dialog.Title style={styles.dialogTitle}>
              Create New Resource
            </Dialog.Title>

            <div style={styles.formGroup}>
              <label style={styles.label}>Resource Name *</label>
              <input
                type="text"
                value={newResource.resourceName}
                onChange={(e) => setNewResource(prev => ({ ...prev, resourceName: e.target.value }))}
                style={styles.input}
                placeholder="e.g., timesheets, users, reports"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Resource Type *</label>
              <select
                value={newResource.resourceTypeId}
                onChange={(e) => setNewResource(prev => ({ ...prev, resourceTypeId: Number(e.target.value) }))}
                style={styles.select}
              >
                <option value={1}>Page</option>
                <option value={2}>API Endpoint</option>
                <option value={3}>Data Entity</option>
                <option value={4}>Component</option>
              </select>
            </div>

            <div style={styles.dialogActions}>
              <Dialog.Close asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleCreate}
                disabled={isSaving || !newResource.resourceName}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: isSaving || !newResource.resourceName ? 0.6 : 1,
                }}
              >
                {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                {isSaving ? 'Creating...' : 'Create Resource'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit Resource Dialog */}
      <Dialog.Root open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={styles.dialogOverlay} />
          <Dialog.Content style={styles.dialogContent}>
            <Dialog.Title style={styles.dialogTitle}>
              Edit Resource
            </Dialog.Title>

            <div style={styles.formGroup}>
              <label style={styles.label}>Resource Name *</label>
              <input
                type="text"
                value={editResourceData.resourceName}
                onChange={(e) => setEditResourceData(prev => ({ ...prev, resourceName: e.target.value }))}
                style={styles.input}
                placeholder="e.g., timesheets, users, reports"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Resource Type *</label>
              <select
                value={editResourceData.resourceTypeId}
                onChange={(e) => setEditResourceData(prev => ({ ...prev, resourceTypeId: Number(e.target.value) }))}
                style={styles.select}
              >
                <option value={1}>Page</option>
                <option value={2}>API Endpoint</option>
                <option value={3}>Data Entity</option>
                <option value={4}>Component</option>
              </select>
            </div>

            <div style={styles.dialogActions}>
              <Dialog.Close asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleEditResource}
                disabled={isSaving || !editResourceData.resourceName}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: isSaving || !editResourceData.resourceName ? 0.6 : 1,
                }}
              >
                {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Pencil size={16} />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Add Resource Attribute Dialog */}
      <Dialog.Root open={isAddAttributeDialogOpen} onOpenChange={setIsAddAttributeDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={styles.dialogOverlay} />
          <Dialog.Content style={styles.dialogContent}>
            <Dialog.Title style={styles.dialogTitle}>
              Add Attribute to {selectedResource?.resourceName}
            </Dialog.Title>

            <div style={styles.formGroup}>
              <label style={styles.label}>Attribute Definition *</label>
              <select
                value={newAttribute.attributeId || ''}
                onChange={(e) => setNewAttribute(prev => ({ ...prev, attributeId: e.target.value }))}
                style={styles.select}
              >
                <option value="">Select an attribute...</option>
                {attributeDefinitions.map(def => (
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
                placeholder="Enter attribute value"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Effective From</label>
              <input
                type="date"
                value={newAttribute.effectiveFrom || ''}
                onChange={(e) => setNewAttribute(prev => ({ ...prev, effectiveFrom: e.target.value }))}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Effective To</label>
              <input
                type="date"
                value={newAttribute.effectiveTo || ''}
                onChange={(e) => setNewAttribute(prev => ({ ...prev, effectiveTo: e.target.value }))}
                style={styles.input}
              />
            </div>

            <div style={styles.dialogActions}>
              <Dialog.Close asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleAddAttribute}
                disabled={isSaving || !newAttribute.attributeId || !newAttribute.attributeValue}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: isSaving || !newAttribute.attributeId || !newAttribute.attributeValue ? 0.6 : 1,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                }}
              >
                {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                {isSaving ? 'Saving...' : 'Add Attribute'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Resource Confirmation */}
      <AlertDialog.Root open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay style={styles.dialogOverlay} />
          <AlertDialog.Content style={styles.dialogContent}>
            <AlertDialog.Title style={styles.dialogTitle}>
              Delete Resource
            </AlertDialog.Title>
            <AlertDialog.Description style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
              Are you sure you want to delete this resource? This may affect policies that reference it.
            </AlertDialog.Description>
            <div style={styles.dialogActions}>
              <AlertDialog.Cancel asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>
                  Cancel
                </button>
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

      {/* Delete Attribute Confirmation */}
      <AlertDialog.Root open={deleteAttrConfirmOpen} onOpenChange={setDeleteAttrConfirmOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay style={styles.dialogOverlay} />
          <AlertDialog.Content style={styles.dialogContent}>
            <AlertDialog.Title style={styles.dialogTitle}>
              Delete Attribute
            </AlertDialog.Title>
            <AlertDialog.Description style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
              Are you sure you want to delete this attribute from the resource? This action cannot be undone.
            </AlertDialog.Description>
            <div style={styles.dialogActions}>
              <AlertDialog.Cancel asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>
                  Cancel
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  onClick={handleDeleteAttribute}
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

// ============================================================================
// Attribute Definitions Management Panel Component
// ============================================================================

interface AttributeDefinitionsPanelProps {
  theme?: string;
}

function AttributeDefinitionsPanel({ theme }: AttributeDefinitionsPanelProps) {
  const api = useAbacApi();

  const [attributeDefinitions, setAttributeDefinitions] = useState<AttributeDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAttrDef, setNewAttrDef] = useState<{
    attributeName: string;
    attributeCategoryId: number;
    dataTypeId: number;
    description: string;
  }>({ attributeName: '', attributeCategoryId: 1, dataTypeId: 1, description: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingAttrDefId, setDeletingAttrDefId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getAllAttributeDefinitions();
      setAttributeDefinitions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attribute definitions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newAttrDef.attributeName) return;

    setIsSaving(true);
    try {
      const created = await api.createAttributeDefinition({
        attributeName: newAttrDef.attributeName,
        attributeCategoryId: newAttrDef.attributeCategoryId,
        dataTypeId: newAttrDef.dataTypeId,
        description: newAttrDef.description,
      });
      setAttributeDefinitions(prev => [...prev, created]);
      setIsCreateDialogOpen(false);
      setNewAttrDef({ attributeName: '', attributeCategoryId: 1, dataTypeId: 1, description: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create attribute definition');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAttrDefId) return;

    setIsSaving(true);
    try {
      await api.deleteAttributeDefinition(deletingAttrDefId);
      setAttributeDefinitions(prev => prev.filter(a => a.attributeId !== deletingAttrDefId));
      setDeleteConfirmOpen(false);
      setDeletingAttrDefId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete attribute definition');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredAttrDefs = attributeDefinitions.filter(attrDef =>
    attrDef.attributeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    attrDef.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Loading attribute definitions...</span>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={styles.cardTitle}>
          <Settings size={18} style={{ marginRight: '8px', display: 'inline' }} />
          Attribute Definitions
        </h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
          <button
            onClick={loadData}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            <Plus size={16} />
            New Attribute
          </button>
        </div>
      </div>
      <div style={styles.cardBody}>
        <div style={styles.searchContainer}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search attributes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {error && (
          <div style={{ ...styles.badge, ...styles.badgeDanger, marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-sm)', display: 'flex', alignItems: 'center' }}>
            <AlertCircle size={16} style={{ marginRight: '8px' }} />
            {error}
          </div>
        )}

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Attribute Name</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Data Type</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttrDefs.map(attrDef => (
              <tr key={attrDef.attributeId}>
                <td style={styles.td}>
                  <span style={{ fontWeight: 500 }}>{attrDef.attributeName}</span>
                </td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, ...styles.badgeInfo }}>
                    {attrDef.attributeCategoryName}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, ...styles.badgeWarning }}>
                    {attrDef.dataTypeName}
                  </span>
                </td>
                <td style={styles.td}>{attrDef.description || '-'}</td>
                <td style={styles.td}>
                  <div style={styles.actionButtons}>
                    <button
                      onClick={() => {
                        setDeletingAttrDefId(attrDef.attributeId);
                        setDeleteConfirmOpen(true);
                      }}
                      style={{ ...styles.iconButton, color: '#dc2626' }}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredAttrDefs.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...styles.td, ...styles.emptyState }}>
                  No attribute definitions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Attribute Definition Dialog */}
      <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={styles.dialogOverlay} />
          <Dialog.Content style={styles.dialogContent}>
            <Dialog.Title style={styles.dialogTitle}>
              Create New Attribute Definition
            </Dialog.Title>

            <div style={styles.formGroup}>
              <label style={styles.label}>Attribute Name *</label>
              <input
                type="text"
                value={newAttrDef.attributeName}
                onChange={(e) => setNewAttrDef(prev => ({ ...prev, attributeName: e.target.value }))}
                style={styles.input}
                placeholder="e.g., department, role, clearanceLevel"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Category *</label>
              <select
                value={newAttrDef.attributeCategoryId}
                onChange={(e) => setNewAttrDef(prev => ({ ...prev, attributeCategoryId: Number(e.target.value) }))}
                style={styles.select}
              >
                <option value={1}>Subject</option>
                <option value={2}>Resource</option>
                <option value={3}>Environment</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Data Type *</label>
              <select
                value={newAttrDef.dataTypeId}
                onChange={(e) => setNewAttrDef(prev => ({ ...prev, dataTypeId: Number(e.target.value) }))}
                style={styles.select}
              >
                <option value={1}>String</option>
                <option value={2}>Number</option>
                <option value={3}>Boolean</option>
                <option value={4}>Date</option>
                <option value={5}>List</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                value={newAttrDef.description}
                onChange={(e) => setNewAttrDef(prev => ({ ...prev, description: e.target.value }))}
                style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                placeholder="Enter attribute description"
              />
            </div>

            <div style={styles.dialogActions}>
              <Dialog.Close asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleCreate}
                disabled={isSaving || !newAttrDef.attributeName}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: isSaving || !newAttrDef.attributeName ? 0.6 : 1,
                }}
              >
                {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                {isSaving ? 'Creating...' : 'Create Attribute'}
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
            <AlertDialog.Title style={styles.dialogTitle}>
              Delete Attribute Definition
            </AlertDialog.Title>
            <AlertDialog.Description style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
              Are you sure you want to delete this attribute definition? This may affect existing subject/resource attributes and policy rules.
            </AlertDialog.Description>
            <div style={styles.dialogActions}>
              <AlertDialog.Cancel asChild>
                <button style={{ ...styles.button, ...styles.secondaryButton }}>
                  Cancel
                </button>
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

// ============================================================================
// Main Component
// ============================================================================

interface AbacPermissionManagementProps {
  theme?: string;
  apiBaseUrl?: string;
}

const TABS: TabItem[] = [
  { id: 'subject-attrs', label: 'Subject Attributes', icon: <Key size={18} /> },
  { id: 'users', label: 'User Assignments', icon: <Users size={18} /> },
  { id: 'groups', label: 'User Groups', icon: <UserPlus size={18} /> },
  { id: 'policies', label: 'Policies & Rules', icon: <Shield size={18} /> },
  { id: 'actions', label: 'Actions', icon: <Zap size={18} /> },
  { id: 'resources', label: 'Resources', icon: <Package size={18} /> },
  { id: 'attributes', label: 'Attribute Definitions', icon: <Settings size={18} /> },
];

// Inner component that uses the ABAC context
function AbacPermissionManagementInner({ theme = 'brand-a' }: { theme?: string }) {
  const [activeTab, setActiveTab] = useState('subject-attrs');

  return (
    <div data-theme={theme} style={styles.pageContainer}>
      <div style={styles.maxWidth}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>
            <Shield size={28} />
            Permission Management
          </h1>
        </div>

        {/* Tabs */}
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List style={styles.tabList}>
            {TABS.map(tab => (
              <Tabs.Trigger
                key={tab.id}
                value={tab.id}
                style={{
                  ...styles.tab,
                  ...(activeTab === tab.id ? styles.tabActive : {}),
                }}
              >
                {tab.icon}
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Tabs.Content value="subject-attrs">
            <SubjectAttributesPanel theme={theme} />
          </Tabs.Content>

          <Tabs.Content value="users">
            <UserPermissionsPanel theme={theme} />
          </Tabs.Content>

          <Tabs.Content value="groups">
            <UserGroupsPanel theme={theme} />
          </Tabs.Content>

          <Tabs.Content value="policies">
            <PolicyManagementPanel theme={theme} />
          </Tabs.Content>

          <Tabs.Content value="actions">
            <ActionsManagementPanel theme={theme} />
          </Tabs.Content>

          <Tabs.Content value="resources">
            <ResourcesManagementPanel theme={theme} />
          </Tabs.Content>

          <Tabs.Content value="attributes">
            <AttributeDefinitionsPanel theme={theme} />
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
}

// Main component that wraps with AbacProvider
export default function AbacPermissionManagement({
  theme = 'brand-a',
  apiBaseUrl = 'http://localhost:1110/api/v1',
}: AbacPermissionManagementProps) {
  return (
    <AbacProvider apiBaseUrl={apiBaseUrl}>
      <AbacPermissionManagementInner theme={theme} />
    </AbacProvider>
  );
}

// Export individual components for flexible usage
export {
  SubjectAttributesPanel,
  UserPermissionsPanel,
  UserGroupsPanel,
  PolicyManagementPanel,
  ActionsManagementPanel,
  ResourcesManagementPanel,
  AttributeDefinitionsPanel,
};
