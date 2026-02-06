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
} from 'lucide-react';

import { AbacProvider, useAbacApi } from '../hooks/AbacProvider';
import {
  User,
  Policy,
  PolicyRule,
  Action,
  Resource,
  AttributeDefinition,
  SubjectAttribute,
  CreateSubjectAttributeRequest,
  CreatePolicyRequest,
  CreatePolicyRuleRequest,
  UpdatePolicyRequest,
  RuleOperator,
  LogicalOperator,
} from '../services/abac-api.service';
import { commonClasses } from '../styles/styles.classes';

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
// User Permissions Panel Component
// ============================================================================

interface UserPermissionsPanelProps {
  theme?: string;
}

function UserPermissionsPanel({ theme }: UserPermissionsPanelProps) {
  const api = useAbacApi();

  const [users, setUsers] = useState<User[]>([]);
  const [attributeDefinitions, setAttributeDefinitions] = useState<AttributeDefinition[]>([]);
  const [subjectAttributes, setSubjectAttributes] = useState<SubjectAttribute[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userAttributes, setUserAttributes] = useState<SubjectAttribute[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddAttributeDialogOpen, setIsAddAttributeDialogOpen] = useState(false);
  const [newAttribute, setNewAttribute] = useState<Partial<CreateSubjectAttributeRequest>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingAttributeId, setDeletingAttributeId] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [usersData, attrDefsData] = await Promise.all([
        api.getActiveUsers(),
        api.getAllAttributeDefinitions(),
      ]);
      setUsers(usersData);
      setAttributeDefinitions(attrDefsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserAttributes = async (userId: string) => {
    setIsLoadingAttributes(true);
    try {
      const attrs = await api.getSubjectAttributesByUserId(userId);
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

  const handleAddAttribute = async () => {
    if (!selectedUser || !newAttribute.attributeDefinitionId || !newAttribute.attributeValue) {
      return;
    }

    setIsSaving(true);
    try {
      const created = await api.createSubjectAttribute({
        userId: selectedUser.userId,
        attributeDefinitionId: newAttribute.attributeDefinitionId,
        attributeValue: newAttribute.attributeValue,
        effectiveFrom: newAttribute.effectiveFrom,
        effectiveTo: newAttribute.effectiveTo,
      });
      setUserAttributes(prev => [...prev, created]);
      setIsAddAttributeDialogOpen(false);
      setNewAttribute({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add attribute');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAttribute = async () => {
    if (!deletingAttributeId) return;

    setIsSaving(true);
    try {
      await api.deleteSubjectAttribute(deletingAttributeId);
      setUserAttributes(prev => prev.filter(a => a.subjectAttributeId !== deletingAttributeId));
      setDeleteConfirmOpen(false);
      setDeletingAttributeId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete attribute');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAttributeName = (attrDefId: string) => {
    const def = attributeDefinitions.find(d => d.attributeDefinitionId === attrDefId);
    return def?.attributeName || 'Unknown';
  };

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
          <button
            onClick={loadData}
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
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
            <div style={{ ...styles.badge, ...styles.badgeDanger, marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-sm)' }}>
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
                      <div style={{ fontWeight: 500 }}>{user.username}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        {user.email || 'No email'}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...(user.isActive ? styles.badgeSuccess : styles.badgeDanger) }}>
                        {user.isActive ? 'Active' : 'Inactive'}
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

      {/* User Attributes */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>
            <Key size={18} style={{ marginRight: '8px', display: 'inline' }} />
            {selectedUser ? `Attributes for ${selectedUser.username}` : 'Select a User'}
          </h3>
          {selectedUser && (
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
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userAttributes.map(attr => (
                    <tr key={attr.subjectAttributeId}>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 500 }}>
                          {attr.attributeName || getAttributeName(attr.attributeDefinitionId)}
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
                              setDeletingAttributeId(attr.subjectAttributeId);
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
                  {userAttributes.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ ...styles.td, ...styles.emptyState }}>
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

      {/* Add Attribute Dialog */}
      <Dialog.Root open={isAddAttributeDialogOpen} onOpenChange={setIsAddAttributeDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={styles.dialogOverlay} />
          <Dialog.Content style={styles.dialogContent}>
            <Dialog.Title style={styles.dialogTitle}>
              Add Attribute to {selectedUser?.username}
            </Dialog.Title>

            <div style={styles.formGroup}>
              <label style={styles.label}>Attribute Definition *</label>
              <select
                value={newAttribute.attributeDefinitionId || ''}
                onChange={(e) => setNewAttribute(prev => ({ ...prev, attributeDefinitionId: e.target.value }))}
                style={styles.select}
              >
                <option value="">Select an attribute...</option>
                {attributeDefinitions.map(def => (
                  <option key={def.attributeDefinitionId} value={def.attributeDefinitionId}>
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
                disabled={isSaving || !newAttribute.attributeDefinitionId || !newAttribute.attributeValue}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: isSaving || !newAttribute.attributeDefinitionId || !newAttribute.attributeValue ? 0.6 : 1,
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog.Root open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay style={styles.dialogOverlay} />
          <AlertDialog.Content style={styles.dialogContent}>
            <AlertDialog.Title style={styles.dialogTitle}>
              Delete Attribute
            </AlertDialog.Title>
            <AlertDialog.Description style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
              Are you sure you want to delete this attribute? This action cannot be undone.
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
// Policy Management Panel Component
// ============================================================================

interface PolicyManagementPanelProps {
  theme?: string;
}

function PolicyManagementPanel({ theme }: PolicyManagementPanelProps) {
  const api = useAbacApi();

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [attributeDefinitions, setAttributeDefinitions] = useState<AttributeDefinition[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [policyRules, setPolicyRules] = useState<PolicyRule[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRules, setIsLoadingRules] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isCreatePolicyDialogOpen, setIsCreatePolicyDialogOpen] = useState(false);
  const [isAddRuleDialogOpen, setIsAddRuleDialogOpen] = useState(false);
  const [isLinkActionDialogOpen, setIsLinkActionDialogOpen] = useState(false);
  const [isLinkResourceDialogOpen, setIsLinkResourceDialogOpen] = useState(false);

  const [newPolicy, setNewPolicy] = useState<Partial<CreatePolicyRequest>>({ priority: 1, policyTypeId: 1 });
  const [newRule, setNewRule] = useState<Partial<CreatePolicyRuleRequest>>({ logicalOperator: 'AND', ruleOrder: 1 });
  const [selectedActionId, setSelectedActionId] = useState<string>('');
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingPolicyId, setDeletingPolicyId] = useState<string | null>(null);
  const [deleteRuleConfirmOpen, setDeleteRuleConfirmOpen] = useState(false);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [policiesData, actionsData, resourcesData, attrDefsData] = await Promise.all([
        api.getAllPolicies(),
        api.getAllActions(),
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

  const loadPolicyRules = async (policyId: string) => {
    setIsLoadingRules(true);
    try {
      const rules = await api.getRulesByPolicyId(policyId);
      setPolicyRules(rules);
    } catch (err) {
      console.error('Failed to load policy rules:', err);
      setPolicyRules([]);
    } finally {
      setIsLoadingRules(false);
    }
  };

  const handleSelectPolicy = (policy: Policy) => {
    setSelectedPolicy(policy);
    loadPolicyRules(policy.policyId);
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
    if (!selectedPolicy || !newRule.attributeDefinitionId || !newRule.operator || !newRule.comparisonValue) return;

    setIsSaving(true);
    try {
      const created = await api.createPolicyRule({
        policyId: selectedPolicy.policyId,
        attributeDefinitionId: newRule.attributeDefinitionId,
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link resource');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPolicies = policies.filter(policy =>
    policy.policyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    policy.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAttributeName = (attrDefId: string) => {
    const def = attributeDefinitions.find(d => d.attributeDefinitionId === attrDefId);
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

      {/* Policy Rules */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>
            <FileText size={18} style={{ marginRight: '8px', display: 'inline' }} />
            {selectedPolicy ? `Rules for ${selectedPolicy.policyName}` : 'Select a Policy'}
          </h3>
          {selectedPolicy && (
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
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
              <p>Select a policy to view and manage its rules</p>
            </div>
          ) : isLoadingRules ? (
            <div style={styles.loadingContainer}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Loading rules...</span>
            </div>
          ) : (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
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
                          {rule.attributeName || getAttributeName(rule.attributeDefinitionId)}
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
                value={newRule.attributeDefinitionId || ''}
                onChange={(e) => setNewRule(prev => ({ ...prev, attributeDefinitionId: e.target.value }))}
                style={styles.select}
              >
                <option value="">Select an attribute...</option>
                {attributeDefinitions.map(def => (
                  <option key={def.attributeDefinitionId} value={def.attributeDefinitionId}>
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
                disabled={isSaving || !newRule.attributeDefinitionId || !newRule.operator || !newRule.comparisonValue}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: isSaving || !newRule.attributeDefinitionId || !newRule.operator || !newRule.comparisonValue ? 0.6 : 1,
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
                  <option key={action.actionId} value={action.actionId}>
                    {action.actionName} - {action.description || 'No description'}
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

  const [actions, setActions] = useState<Action[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAction, setNewAction] = useState<{ actionName: string; description: string }>({ actionName: '', description: '' });
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
      const data = await api.getAllActions();
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
      const created = await api.createAction({
        actionName: newAction.actionName,
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
      await api.deleteAction(deletingActionId);
      setActions(prev => prev.filter(a => a.actionId !== deletingActionId));
      setDeleteConfirmOpen(false);
      setDeletingActionId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete action');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredActions = actions.filter(action =>
    action.actionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
              <tr key={action.actionId}>
                <td style={styles.td}>
                  <span style={{ fontWeight: 500 }}>{action.actionName}</span>
                </td>
                <td style={styles.td}>{action.description || '-'}</td>
                <td style={styles.td}>
                  {new Date(action.createdAt).toLocaleDateString()}
                </td>
                <td style={styles.td}>
                  <div style={styles.actionButtons}>
                    <button
                      onClick={() => {
                        setDeletingActionId(action.actionId);
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
      setAttributeDefinitions(prev => prev.filter(a => a.attributeDefinitionId !== deletingAttrDefId));
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
              <tr key={attrDef.attributeDefinitionId}>
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
                        setDeletingAttrDefId(attrDef.attributeDefinitionId);
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
  { id: 'users', label: 'User Permissions', icon: <Users size={18} /> },
  { id: 'policies', label: 'Policies & Rules', icon: <Shield size={18} /> },
  { id: 'actions', label: 'Actions', icon: <Zap size={18} /> },
  { id: 'attributes', label: 'Attribute Definitions', icon: <Settings size={18} /> },
];

// Inner component that uses the ABAC context
function AbacPermissionManagementInner({ theme = 'brand-a' }: { theme?: string }) {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div data-theme={theme} style={styles.pageContainer}>
      <div style={styles.maxWidth}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>
            <Shield size={28} />
            ABAC Permission Management
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

          <Tabs.Content value="users">
            <UserPermissionsPanel theme={theme} />
          </Tabs.Content>

          <Tabs.Content value="policies">
            <PolicyManagementPanel theme={theme} />
          </Tabs.Content>

          <Tabs.Content value="actions">
            <ActionsManagementPanel theme={theme} />
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
  UserPermissionsPanel,
  PolicyManagementPanel,
  ActionsManagementPanel,
  AttributeDefinitionsPanel,
};
