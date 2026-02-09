/**
 * Policy Management Panel Component
 * Allows administrators to manage policies, rules, and obligations
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
  Shield,
  FileText,
  Zap,
  Target,
  X,
} from 'lucide-react';

import { useAbacApi } from '../hooks/AbacProvider';
import {
  Policy,
  PolicyRule,
  PolicyObligation,
  Operation,
  Resource,
  AttributeDefinition,
  CreatePolicyRequest,
  CreatePolicyRuleRequest,
  UpdatePolicyObligationRequest,
  CreatePolicyObligationRequest,
  RuleOperator,
  LogicalOperator,
} from '../services/abac-api.service';
import { styles } from './styles';
import { RULE_OPERATORS, LOGICAL_OPERATORS } from './constants';

// ============================================================================
// Types
// ============================================================================

export interface PolicyManagementPanelProps {
  theme?: string;
}

// ============================================================================
// Component
// ============================================================================

export function PolicyManagementPanel({ theme }: PolicyManagementPanelProps) {
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

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [policiesData, actionsData, resourcesData, attrDefsData] = await Promise.all([
        api.getAllPolicies(), api.getAllOperations(), api.getAllResources(), api.getAllAttributeDefinitions(),
      ]);
      setPolicies(policiesData); setActions(actionsData); setResources(resourcesData); setAttributeDefinitions(attrDefsData);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load data'); } finally { setIsLoading(false); }
  };

  const loadPolicyDetails = async (policyId: string) => {
    setIsLoadingRules(true);
    try {
      const [rules, obligations, operations, linkedResources] = await Promise.all([
        api.getRulesByPolicyId(policyId), api.getObligationsByPolicyId(Number(policyId)),
        api.getOperationsForPolicy(policyId), api.getResourcesForPolicy(policyId),
      ]);
      setPolicyRules(rules); setPolicyObligations(obligations); setPolicyOperations(operations); setPolicyResources(linkedResources);
    } catch (err) {
      console.error('Failed to load policy details:', err);
      setPolicyRules([]); setPolicyObligations([]); setPolicyOperations([]); setPolicyResources([]);
    } finally { setIsLoadingRules(false); }
  };

  const handleSelectPolicy = (policy: Policy) => { setSelectedPolicy(policy); loadPolicyDetails(policy.policyId); };

  const handleCreatePolicy = async () => {
    if (!newPolicy.policyName || !newPolicy.policyTypeId) return;
    setIsSaving(true);
    try {
      const created = await api.createPolicy({ policyName: newPolicy.policyName, policyTypeId: newPolicy.policyTypeId, description: newPolicy.description, priority: newPolicy.priority || 1 });
      setPolicies(prev => [...prev, created]); setIsCreatePolicyDialogOpen(false); setNewPolicy({ priority: 1, policyTypeId: 1 });
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to create policy'); } finally { setIsSaving(false); }
  };

  const handleDeletePolicy = async () => {
    if (!deletingPolicyId) return;
    setIsSaving(true);
    try {
      await api.deletePolicy(deletingPolicyId);
      setPolicies(prev => prev.filter(p => p.policyId !== deletingPolicyId));
      if (selectedPolicy?.policyId === deletingPolicyId) { setSelectedPolicy(null); setPolicyRules([]); setPolicyObligations([]); setPolicyOperations([]); setPolicyResources([]); }
      setDeleteConfirmOpen(false); setDeletingPolicyId(null);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete policy'); } finally { setIsSaving(false); }
  };

  const handleAddRule = async () => {
    if (!selectedPolicy || !newRule.attributeId || !newRule.operator || !newRule.comparisonValue) return;
    setIsSaving(true);
    try {
      const created = await api.createPolicyRule({ policyId: selectedPolicy.policyId, attributeId: newRule.attributeId, operator: newRule.operator as RuleOperator, comparisonValue: newRule.comparisonValue, logicalOperator: newRule.logicalOperator as LogicalOperator, ruleOrder: newRule.ruleOrder || policyRules.length + 1 });
      setPolicyRules(prev => [...prev, created]); setIsAddRuleDialogOpen(false); setNewRule({ logicalOperator: 'AND', ruleOrder: policyRules.length + 2 });
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to add rule'); } finally { setIsSaving(false); }
  };

  const handleDeleteRule = async () => {
    if (!deletingRuleId) return;
    setIsSaving(true);
    try { await api.deletePolicyRule(deletingRuleId); setPolicyRules(prev => prev.filter(r => r.ruleId !== deletingRuleId)); setDeleteRuleConfirmOpen(false); setDeletingRuleId(null); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete rule'); } finally { setIsSaving(false); }
  };

  const handleLinkAction = async () => {
    if (!selectedPolicy || !selectedActionId) return;
    setIsSaving(true);
    try { await api.addActionToPolicy(selectedPolicy.policyId, selectedActionId); setIsLinkActionDialogOpen(false); setSelectedActionId(''); loadPolicyDetails(selectedPolicy.policyId); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to link action'); } finally { setIsSaving(false); }
  };

  const handleLinkResource = async () => {
    if (!selectedPolicy || !selectedResourceId) return;
    setIsSaving(true);
    try { await api.addResourceToPolicy(selectedPolicy.policyId, selectedResourceId); setIsLinkResourceDialogOpen(false); setSelectedResourceId(''); loadPolicyDetails(selectedPolicy.policyId); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to link resource'); } finally { setIsSaving(false); }
  };

  const handleUnlinkAction = async (operationId: string) => {
    if (!selectedPolicy) return;
    try { await api.removeActionFromPolicy(selectedPolicy.policyId, operationId); loadPolicyDetails(selectedPolicy.policyId); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to unlink action'); }
  };

  const handleUnlinkResource = async (resourceId: string) => {
    if (!selectedPolicy) return;
    try { await api.removeResourceFromPolicy(selectedPolicy.policyId, resourceId); loadPolicyDetails(selectedPolicy.policyId); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to unlink resource'); }
  };

  const handleAddObligation = async () => {
    if (!selectedPolicy || !newObligation.obligationTypeId) return;
    setIsSaving(true);
    try {
      const created = await api.createPolicyObligation({ policyId: Number(selectedPolicy.policyId), obligationTypeId: newObligation.obligationTypeId, obligationParams: newObligation.obligationParams, isMandatory: newObligation.isMandatory });
      setPolicyObligations(prev => [...prev, created]); setIsAddObligationDialogOpen(false); setNewObligation({ isMandatory: true });
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to add obligation'); } finally { setIsSaving(false); }
  };

  const handleStartEditObligation = (obligation: PolicyObligation) => {
    setEditingObligation(obligation);
    setEditObligationData({ obligationTypeId: obligation.obligationTypeId, obligationParams: obligation.obligationParams, isMandatory: obligation.isMandatory });
    setIsEditObligationDialogOpen(true);
  };

  const handleEditObligation = async () => {
    if (!editingObligation || !editObligationData.obligationTypeId) return;
    setIsSaving(true);
    try {
      const updated = await api.updatePolicyObligation(editingObligation.obligationId, { obligationTypeId: editObligationData.obligationTypeId, obligationParams: editObligationData.obligationParams, isMandatory: editObligationData.isMandatory });
      setPolicyObligations(prev => prev.map(o => o.obligationId === editingObligation.obligationId ? updated : o)); setIsEditObligationDialogOpen(false); setEditingObligation(null);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to update obligation'); } finally { setIsSaving(false); }
  };

  const handleDeleteObligation = async () => {
    if (deletingObligationId === null) return;
    setIsSaving(true);
    try { await api.deletePolicyObligation(deletingObligationId); setPolicyObligations(prev => prev.filter(o => o.obligationId !== deletingObligationId)); setDeleteObligationConfirmOpen(false); setDeletingObligationId(null); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete obligation'); } finally { setIsSaving(false); }
  };

  const getAttributeName = (attrDefId: string) => { const def = attributeDefinitions.find(d => d.attributeId === attrDefId); return def?.attributeName || 'Unknown'; };

  const policiesColumns = useMemo<MRT_ColumnDef<Policy>[]>(() => [
    {
      accessorKey: 'policyName',
      header: 'Policy',
      Cell: ({ row }) => (
        <div>
          <div style={{ fontWeight: 500 }}>{row.original.policyName}</div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{row.original.description || 'No description'}</div>
        </div>
      ),
    },
    {
      accessorKey: 'policyTypeName',
      header: 'Type',
      Cell: ({ cell }) => (
        <span style={{ ...styles.badge, ...(cell.getValue<string>() === 'PERMIT' ? styles.badgeSuccess : styles.badgeDanger) }}>{cell.getValue<string>()}</span>
      ),
    },
    { accessorKey: 'priority', header: 'Priority' },
    {
      id: 'actions',
      header: 'Actions',
      enableColumnFilter: false,
      enableSorting: false,
      Cell: ({ row }) => (
        <div style={styles.actionButtons}>
          <button onClick={(e) => { e.stopPropagation(); setDeletingPolicyId(row.original.policyId); setDeleteConfirmOpen(true); }} style={{ ...styles.iconButton, color: '#dc2626' }} title="Delete"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ], []);

  const policiesTable = useMantineReactTable({
    columns: policiesColumns,
    data: policies,
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
    initialState: { density: 'xs', showGlobalFilter: true, pagination: { pageSize: 10, pageIndex: 0 } },
    paginationDisplayMode: 'pages',
    state: { isLoading, showAlertBanner: !!error },
    mantineToolbarAlertBannerProps: error ? { color: 'red', children: error } : undefined,
    mantineTableProps: { striped: true, withTableBorder: true, withColumnBorders: true },
    mantineTableHeadCellProps: { align: 'center' },
    mantineTableBodyCellProps: { align: 'center' },
    mantineTableBodyRowProps: ({ row }) => ({
      onClick: () => handleSelectPolicy(row.original),
      style: { cursor: 'pointer', backgroundColor: selectedPolicy?.policyId === row.original.policyId ? 'var(--color-primary-light)' : undefined },
    }),
    renderTopToolbarCustomActions: () => (
      <Box style={{ display: 'flex', gap: '16px', padding: '8px' }}>
        <button onClick={loadData} style={{ ...styles.button, ...styles.secondaryButton }}><RefreshCw size={16} /></button>
        <button onClick={() => setIsCreatePolicyDialogOpen(true)} style={{ ...styles.button, ...styles.primaryButton }}><Plus size={16} /> New Policy</button>
      </Box>
    ),
  });

  const rulesColumns = useMemo<MRT_ColumnDef<PolicyRule>[]>(() => [
    { accessorKey: 'ruleOrder', header: 'Order' },
    { accessorFn: (row) => row.attributeName || getAttributeName(row.attributeId), id: 'attribute', header: 'Attribute', Cell: ({ renderedCellValue }) => <span style={{ fontWeight: 500 }}>{renderedCellValue}</span> },
    { accessorKey: 'operator', header: 'Operator', Cell: ({ cell }) => <span style={{ ...styles.badge, ...styles.badgeInfo }}>{cell.getValue<string>()}</span> },
    { accessorKey: 'comparisonValue', header: 'Value' },
    { accessorKey: 'logicalOperator', header: 'Logic', Cell: ({ cell }) => <span style={{ ...styles.badge, ...styles.badgeWarning }}>{cell.getValue<string>()}</span> },
    { id: 'actions', header: 'Actions', enableColumnFilter: false, enableSorting: false, Cell: ({ row }) => (
      <div style={styles.actionButtons}><button onClick={() => { setDeletingRuleId(row.original.ruleId); setDeleteRuleConfirmOpen(true); }} style={{ ...styles.iconButton, color: '#dc2626' }} title="Delete"><Trash2 size={16} /></button></div>
    ) },
  ], [attributeDefinitions]);

  const rulesTable = useMantineReactTable({
    columns: rulesColumns, data: [...policyRules].sort((a, b) => a.ruleOrder - b.ruleOrder),
    enablePagination: false, enableColumnFilters: false, enableGlobalFilter: false, enableSorting: true,
    enableFullScreenToggle: false, enableDensityToggle: false, enableTopToolbar: false, enableBottomToolbar: false,
    mantineTableProps: { striped: true, withTableBorder: true, withColumnBorders: true },
  });

  const linkedActionsColumns = useMemo<MRT_ColumnDef<Operation>[]>(() => [
    { accessorKey: 'operationName', header: 'Name', Cell: ({ cell }) => <span style={{ fontWeight: 500 }}>{cell.getValue<string>()}</span> },
    { accessorKey: 'description', header: 'Description', Cell: ({ cell }) => cell.getValue<string>() || '-' },
    { id: 'actions', header: 'Actions', enableColumnFilter: false, enableSorting: false, Cell: ({ row }) => (
      <div style={styles.actionButtons}><button onClick={() => handleUnlinkAction(row.original.operationId)} style={{ ...styles.iconButton, color: '#dc2626' }} title="Unlink Action"><X size={16} /></button></div>
    ) },
  ], [selectedPolicy]);

  const linkedActionsTable = useMantineReactTable({
    columns: linkedActionsColumns, data: policyOperations,
    enablePagination: false, enableColumnFilters: false, enableGlobalFilter: false, enableSorting: true,
    enableFullScreenToggle: false, enableDensityToggle: false, enableTopToolbar: false, enableBottomToolbar: false,
    mantineTableProps: { striped: true, withTableBorder: true, withColumnBorders: true },
  });

  const linkedResourcesColumns = useMemo<MRT_ColumnDef<Resource>[]>(() => [
    { accessorKey: 'resourceName', header: 'Name', Cell: ({ cell }) => <span style={{ fontWeight: 500 }}>{cell.getValue<string>()}</span> },
    { accessorKey: 'resourceTypeName', header: 'Type', Cell: ({ cell }) => <span style={{ ...styles.badge, ...styles.badgeInfo }}>{cell.getValue<string>()}</span> },
    { id: 'actions', header: 'Actions', enableColumnFilter: false, enableSorting: false, Cell: ({ row }) => (
      <div style={styles.actionButtons}><button onClick={() => handleUnlinkResource(row.original.resourceId)} style={{ ...styles.iconButton, color: '#dc2626' }} title="Unlink Resource"><X size={16} /></button></div>
    ) },
  ], [selectedPolicy]);

  const linkedResourcesTable = useMantineReactTable({
    columns: linkedResourcesColumns, data: policyResources,
    enablePagination: false, enableColumnFilters: false, enableGlobalFilter: false, enableSorting: true,
    enableFullScreenToggle: false, enableDensityToggle: false, enableTopToolbar: false, enableBottomToolbar: false,
    mantineTableProps: { striped: true, withTableBorder: true, withColumnBorders: true },
  });

  const obligationsColumns = useMemo<MRT_ColumnDef<PolicyObligation>[]>(() => [
    { accessorKey: 'obligationTypeName', header: 'Type', Cell: ({ cell }) => <span style={{ ...styles.badge, ...styles.badgeInfo }}>{cell.getValue<string>()}</span> },
    { accessorKey: 'obligationParams', header: 'Parameters', Cell: ({ cell }) => {
      const val = cell.getValue<string>();
      return <span style={{ fontSize: 'var(--font-size-xs)', fontFamily: 'monospace' }}>{val ? (val.length > 60 ? val.substring(0, 60) + '...' : val) : '-'}</span>;
    } },
    { accessorKey: 'isMandatory', header: 'Mandatory', Cell: ({ cell }) => <span style={{ ...styles.badge, ...(cell.getValue<boolean>() ? styles.badgeSuccess : styles.badgeWarning) }}>{cell.getValue<boolean>() ? 'Yes' : 'No'}</span> },
    { id: 'actions', header: 'Actions', enableColumnFilter: false, enableSorting: false, Cell: ({ row }) => (
      <div style={styles.actionButtons}>
        <button onClick={() => handleStartEditObligation(row.original)} style={{ ...styles.iconButton, color: 'var(--color-primary)' }} title="Edit"><Pencil size={16} /></button>
        <button onClick={() => { setDeletingObligationId(row.original.obligationId); setDeleteObligationConfirmOpen(true); }} style={{ ...styles.iconButton, color: '#dc2626' }} title="Delete"><Trash2 size={16} /></button>
      </div>
    ) },
  ], []);

  const obligationsTable = useMantineReactTable({
    columns: obligationsColumns, data: policyObligations,
    enablePagination: false, enableColumnFilters: false, enableGlobalFilter: false, enableSorting: true,
    enableFullScreenToggle: false, enableDensityToggle: false, enableTopToolbar: false, enableBottomToolbar: false,
    mantineTableProps: { striped: true, withTableBorder: true, withColumnBorders: true },
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
      <div style={styles.card}>
        <MantineReactTable table={policiesTable} />
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>
            <FileText size={18} style={{ marginRight: '8px', display: 'inline' }} />
            {selectedPolicy ? selectedPolicy.policyName : 'Select a Policy'}
          </h3>
          {selectedPolicy && (
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap' as const }}>
              <button onClick={() => setIsLinkActionDialogOpen(true)} style={{ ...styles.button, ...styles.secondaryButton }} title="Link Action"><Zap size={16} /> Link Action</button>
              <button onClick={() => setIsLinkResourceDialogOpen(true)} style={{ ...styles.button, ...styles.secondaryButton }} title="Link Resource"><Target size={16} /> Link Resource</button>
              <button onClick={() => setIsAddRuleDialogOpen(true)} style={{ ...styles.button, ...styles.primaryButton }}><Plus size={16} /> Add Rule</button>
            </div>
          )}
        </div>
        <div style={styles.cardBody}>
          {!selectedPolicy ? (
            <div style={styles.emptyState}><Shield size={48} style={{ marginBottom: 'var(--spacing-md)', opacity: 0.5 }} /><p>Select a policy to view and manage its rules and obligations</p></div>
          ) : isLoadingRules ? (
            <div style={styles.loadingContainer}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /><span>Loading policy details...</span></div>
          ) : (
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)', textTransform: 'uppercase' as const }}>Rules</h4>
              <MantineReactTable table={rulesTable} />

              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-sm)', textTransform: 'uppercase' as const }}>Linked Actions</h4>
              <MantineReactTable table={linkedActionsTable} />

              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-sm)', textTransform: 'uppercase' as const }}>Linked Resources</h4>
              <MantineReactTable table={linkedResourcesTable} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-sm)' }}>
                <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' as const }}>Obligations</h4>
                <button onClick={() => setIsAddObligationDialogOpen(true)} style={{ ...styles.button, ...styles.primaryButton }}><Plus size={16} /> Add Obligation</button>
              </div>
              <MantineReactTable table={obligationsTable} />
            </div>
          )}
        </div>
      </div>

      {/* Create Policy Dialog */}
      <Dialog.Root open={isCreatePolicyDialogOpen} onOpenChange={setIsCreatePolicyDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={styles.dialogOverlay} />
          <Dialog.Content style={styles.dialogContent}>
            <Dialog.Title style={styles.dialogTitle}>Create New Policy</Dialog.Title>
            <div style={styles.formGroup}><label style={styles.label}>Policy Name *</label><input type="text" value={newPolicy.policyName || ''} onChange={(e) => setNewPolicy(prev => ({ ...prev, policyName: e.target.value }))} style={styles.input} placeholder="Enter policy name" /></div>
            <div style={styles.formGroup}><label style={styles.label}>Policy Type *</label><select value={newPolicy.policyTypeId || 1} onChange={(e) => setNewPolicy(prev => ({ ...prev, policyTypeId: Number(e.target.value) }))} style={styles.select}><option value={1}>PERMIT</option><option value={2}>DENY</option></select></div>
            <div style={styles.formGroup}><label style={styles.label}>Priority</label><input type="number" value={newPolicy.priority || 1} onChange={(e) => setNewPolicy(prev => ({ ...prev, priority: Number(e.target.value) }))} style={styles.input} min={1} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Description</label><textarea value={newPolicy.description || ''} onChange={(e) => setNewPolicy(prev => ({ ...prev, description: e.target.value }))} style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }} placeholder="Enter policy description" /></div>
            <div style={styles.dialogActions}>
              <Dialog.Close asChild><button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button></Dialog.Close>
              <button onClick={handleCreatePolicy} disabled={isSaving || !newPolicy.policyName} style={{ ...styles.button, ...styles.primaryButton, opacity: isSaving || !newPolicy.policyName ? 0.6 : 1 }}>
                {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />} {isSaving ? 'Creating...' : 'Create Policy'}
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
            <Dialog.Title style={styles.dialogTitle}>Add Rule to {selectedPolicy?.policyName}</Dialog.Title>
            <div style={styles.formGroup}><label style={styles.label}>Attribute *</label><select value={newRule.attributeId || ''} onChange={(e) => setNewRule(prev => ({ ...prev, attributeId: e.target.value }))} style={styles.select}><option value="">Select an attribute...</option>{attributeDefinitions.map(def => (<option key={def.attributeId} value={def.attributeId}>{def.attributeName} ({def.attributeCategoryName})</option>))}</select></div>
            <div style={styles.formGroup}><label style={styles.label}>Operator *</label><select value={newRule.operator || ''} onChange={(e) => setNewRule(prev => ({ ...prev, operator: e.target.value as RuleOperator }))} style={styles.select}><option value="">Select an operator...</option>{RULE_OPERATORS.map(op => (<option key={op.value} value={op.value}>{op.label}</option>))}</select></div>
            <div style={styles.formGroup}><label style={styles.label}>Comparison Value *</label><input type="text" value={newRule.comparisonValue || ''} onChange={(e) => setNewRule(prev => ({ ...prev, comparisonValue: e.target.value }))} style={styles.input} placeholder="Enter value to compare" /></div>
            <div style={styles.formGroup}><label style={styles.label}>Logical Operator</label><select value={newRule.logicalOperator || 'AND'} onChange={(e) => setNewRule(prev => ({ ...prev, logicalOperator: e.target.value as LogicalOperator }))} style={styles.select}>{LOGICAL_OPERATORS.map(op => (<option key={op.value} value={op.value}>{op.label}</option>))}</select></div>
            <div style={styles.formGroup}><label style={styles.label}>Rule Order</label><input type="number" value={newRule.ruleOrder || policyRules.length + 1} onChange={(e) => setNewRule(prev => ({ ...prev, ruleOrder: Number(e.target.value) }))} style={styles.input} min={1} /></div>
            <div style={styles.dialogActions}>
              <Dialog.Close asChild><button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button></Dialog.Close>
              <button onClick={handleAddRule} disabled={isSaving || !newRule.attributeId || !newRule.operator || !newRule.comparisonValue} style={{ ...styles.button, ...styles.primaryButton, opacity: isSaving || !newRule.attributeId || !newRule.operator || !newRule.comparisonValue ? 0.6 : 1 }}>
                {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />} {isSaving ? 'Adding...' : 'Add Rule'}
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
            <Dialog.Title style={styles.dialogTitle}>Link Action to {selectedPolicy?.policyName}</Dialog.Title>
            <div style={styles.formGroup}><label style={styles.label}>Select Action *</label><select value={selectedActionId} onChange={(e) => setSelectedActionId(e.target.value)} style={styles.select}><option value="">Select an action...</option>{actions.map(action => (<option key={action.operationId} value={action.operationId}>{action.operationName} - {action.description || 'No description'}</option>))}</select></div>
            <div style={styles.dialogActions}>
              <Dialog.Close asChild><button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button></Dialog.Close>
              <button onClick={handleLinkAction} disabled={isSaving || !selectedActionId} style={{ ...styles.button, ...styles.primaryButton, opacity: isSaving || !selectedActionId ? 0.6 : 1 }}>
                {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={16} />} {isSaving ? 'Linking...' : 'Link Action'}
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
            <Dialog.Title style={styles.dialogTitle}>Link Resource to {selectedPolicy?.policyName}</Dialog.Title>
            <div style={styles.formGroup}><label style={styles.label}>Select Resource *</label><select value={selectedResourceId} onChange={(e) => setSelectedResourceId(e.target.value)} style={styles.select}><option value="">Select a resource...</option>{resources.map(resource => (<option key={resource.resourceId} value={resource.resourceId}>{resource.resourceName} ({resource.resourceTypeName})</option>))}</select></div>
            <div style={styles.dialogActions}>
              <Dialog.Close asChild><button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button></Dialog.Close>
              <button onClick={handleLinkResource} disabled={isSaving || !selectedResourceId} style={{ ...styles.button, ...styles.primaryButton, opacity: isSaving || !selectedResourceId ? 0.6 : 1 }}>
                {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Target size={16} />} {isSaving ? 'Linking...' : 'Link Resource'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Policy Confirmation */}
      <AlertDialog.Root open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialog.Portal><AlertDialog.Overlay style={styles.dialogOverlay} /><AlertDialog.Content style={styles.dialogContent}>
          <AlertDialog.Title style={styles.dialogTitle}>Delete Policy</AlertDialog.Title>
          <AlertDialog.Description style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>Are you sure you want to delete this policy? All associated rules will also be deleted. This action cannot be undone.</AlertDialog.Description>
          <div style={styles.dialogActions}><AlertDialog.Cancel asChild><button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button></AlertDialog.Cancel><AlertDialog.Action asChild><button onClick={handleDeletePolicy} disabled={isSaving} style={{ ...styles.button, ...styles.dangerButton }}>{isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={16} />} {isSaving ? 'Deleting...' : 'Delete'}</button></AlertDialog.Action></div>
        </AlertDialog.Content></AlertDialog.Portal>
      </AlertDialog.Root>

      {/* Delete Rule Confirmation */}
      <AlertDialog.Root open={deleteRuleConfirmOpen} onOpenChange={setDeleteRuleConfirmOpen}>
        <AlertDialog.Portal><AlertDialog.Overlay style={styles.dialogOverlay} /><AlertDialog.Content style={styles.dialogContent}>
          <AlertDialog.Title style={styles.dialogTitle}>Delete Rule</AlertDialog.Title>
          <AlertDialog.Description style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>Are you sure you want to delete this rule? This action cannot be undone.</AlertDialog.Description>
          <div style={styles.dialogActions}><AlertDialog.Cancel asChild><button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button></AlertDialog.Cancel><AlertDialog.Action asChild><button onClick={handleDeleteRule} disabled={isSaving} style={{ ...styles.button, ...styles.dangerButton }}>{isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={16} />} {isSaving ? 'Deleting...' : 'Delete'}</button></AlertDialog.Action></div>
        </AlertDialog.Content></AlertDialog.Portal>
      </AlertDialog.Root>

      {/* Add Obligation Dialog */}
      <Dialog.Root open={isAddObligationDialogOpen} onOpenChange={setIsAddObligationDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={styles.dialogOverlay} />
          <Dialog.Content style={styles.dialogContent}>
            <Dialog.Title style={styles.dialogTitle}>Add Obligation to {selectedPolicy?.policyName}</Dialog.Title>
            <div style={styles.formGroup}><label style={styles.label}>Obligation Type *</label><select value={newObligation.obligationTypeId || ''} onChange={(e) => setNewObligation(prev => ({ ...prev, obligationTypeId: Number(e.target.value) }))} style={styles.select}><option value="">Select a type...</option><option value={1}>log_access</option><option value={2}>notify_admin</option><option value={3}>encrypt_data</option><option value={4}>audit_trail</option><option value={5}>rate_limit</option></select></div>
            <div style={styles.formGroup}><label style={styles.label}>Parameters (JSON)</label><textarea value={newObligation.obligationParams || ''} onChange={(e) => setNewObligation(prev => ({ ...prev, obligationParams: e.target.value }))} style={{ ...styles.input, minHeight: '100px', resize: 'vertical' as const, fontFamily: 'monospace' }} placeholder='{"message": "Access logged", "severity": "info"}' /></div>
            <div style={styles.formGroup}><label style={styles.label}>Mandatory</label><select value={newObligation.isMandatory ? 'true' : 'false'} onChange={(e) => setNewObligation(prev => ({ ...prev, isMandatory: e.target.value === 'true' }))} style={styles.select}><option value="true">Yes</option><option value="false">No</option></select></div>
            <div style={styles.dialogActions}>
              <Dialog.Close asChild><button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button></Dialog.Close>
              <button onClick={handleAddObligation} disabled={isSaving || !newObligation.obligationTypeId} style={{ ...styles.button, ...styles.primaryButton, opacity: isSaving || !newObligation.obligationTypeId ? 0.6 : 1 }}>
                {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />} {isSaving ? 'Adding...' : 'Add Obligation'}
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
            <Dialog.Title style={styles.dialogTitle}>Edit Obligation</Dialog.Title>
            <div style={styles.formGroup}><label style={styles.label}>Obligation Type *</label><select title="Obligation Type" value={editObligationData.obligationTypeId || ''} onChange={(e) => setEditObligationData(prev => ({ ...prev, obligationTypeId: Number(e.target.value) }))} style={styles.select}><option value="">Select a type...</option><option value={1}>log_access</option><option value={2}>notify_admin</option><option value={3}>encrypt_data</option><option value={4}>audit_trail</option><option value={5}>rate_limit</option></select></div>
            <div style={styles.formGroup}><label style={styles.label}>Parameters (JSON)</label><textarea value={editObligationData.obligationParams || ''} onChange={(e) => setEditObligationData(prev => ({ ...prev, obligationParams: e.target.value }))} style={{ ...styles.input, minHeight: '100px', resize: 'vertical' as const, fontFamily: 'monospace' }} placeholder='{"message": "Access logged", "severity": "info"}' /></div>
            <div style={styles.formGroup}><label style={styles.label}>Mandatory</label><select title="Mandatory" value={editObligationData.isMandatory ? 'true' : 'false'} onChange={(e) => setEditObligationData(prev => ({ ...prev, isMandatory: e.target.value === 'true' }))} style={styles.select}><option value="true">Yes</option><option value="false">No</option></select></div>
            <div style={styles.dialogActions}>
              <Dialog.Close asChild><button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button></Dialog.Close>
              <button onClick={handleEditObligation} disabled={isSaving || !editObligationData.obligationTypeId} style={{ ...styles.button, ...styles.primaryButton, opacity: isSaving || !editObligationData.obligationTypeId ? 0.6 : 1 }}>
                {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Pencil size={16} />} {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Obligation Confirmation */}
      <AlertDialog.Root open={deleteObligationConfirmOpen} onOpenChange={setDeleteObligationConfirmOpen}>
        <AlertDialog.Portal><AlertDialog.Overlay style={styles.dialogOverlay} /><AlertDialog.Content style={styles.dialogContent}>
          <AlertDialog.Title style={styles.dialogTitle}>Delete Obligation</AlertDialog.Title>
          <AlertDialog.Description style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>Are you sure you want to delete this obligation? This action cannot be undone.</AlertDialog.Description>
          <div style={styles.dialogActions}><AlertDialog.Cancel asChild><button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button></AlertDialog.Cancel><AlertDialog.Action asChild><button onClick={handleDeleteObligation} disabled={isSaving} style={{ ...styles.button, ...styles.dangerButton }}>{isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={16} />} {isSaving ? 'Deleting...' : 'Delete'}</button></AlertDialog.Action></div>
        </AlertDialog.Content></AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
