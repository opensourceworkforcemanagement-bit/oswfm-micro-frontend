/**
 * Resources Management Panel Component
 * Allows administrators to manage resources and their attributes
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
  Key,
  Package,
} from 'lucide-react';

import { useAbacApi } from '../hooks/AbacProvider';
import {
  Resource,
  ResourceAttribute,
  AttributeDefinition,
  CreateResourceAttributeRequest,
} from '../services/abac-api.service';
import { styles } from './styles';

// ============================================================================
// Types
// ============================================================================

export interface ResourcesManagementPanelProps {
  theme?: string;
}

// ============================================================================
// Component
// ============================================================================

export function ResourcesManagementPanel({ theme }: ResourcesManagementPanelProps) {
  const api = useAbacApi();

  const [resources, setResources] = useState<Resource[]>([]);
  const [attributeDefinitions, setAttributeDefinitions] = useState<AttributeDefinition[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [resourceAttributes, setResourceAttributes] = useState<ResourceAttribute[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newResource, setNewResource] = useState<{ resourceName: string; resourceTypeId: number }>({ resourceName: '', resourceTypeId: 1 });
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [editResourceData, setEditResourceData] = useState<{ resourceName: string; resourceTypeId: number }>({ resourceName: '', resourceTypeId: 1 });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);

  const [isAddAttributeDialogOpen, setIsAddAttributeDialogOpen] = useState(false);
  const [newAttribute, setNewAttribute] = useState<Partial<CreateResourceAttributeRequest>>({});
  const [deleteAttrConfirmOpen, setDeleteAttrConfirmOpen] = useState(false);
  const [deletingAttrId, setDeletingAttrId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true); setError(null);
    try { const [resourcesData, attrDefsData] = await Promise.all([api.getAllResources(), api.getAllAttributeDefinitions()]); setResources(resourcesData); setAttributeDefinitions(attrDefsData); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load data'); }
    finally { setIsLoading(false); }
  };

  const loadResourceAttributes = async (resourceId: string) => {
    setIsLoadingAttributes(true);
    try { const attrs = await api.getResourceAttributesByResourceId(resourceId); setResourceAttributes(attrs); }
    catch (err) { console.error('Failed to load resource attributes:', err); setResourceAttributes([]); }
    finally { setIsLoadingAttributes(false); }
  };

  const handleSelectResource = (resource: Resource) => { setSelectedResource(resource); loadResourceAttributes(resource.resourceId); };

  const handleCreate = async () => {
    if (!newResource.resourceName) return;
    setIsSaving(true);
    try { const created = await api.createResource({ resourceName: newResource.resourceName, resourceTypeId: newResource.resourceTypeId }); setResources(prev => [...prev, created]); setIsCreateDialogOpen(false); setNewResource({ resourceName: '', resourceTypeId: 1 }); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to create resource'); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!deletingResourceId) return;
    setIsSaving(true);
    try { await api.deleteResource(deletingResourceId); setResources(prev => prev.filter(r => r.resourceId !== deletingResourceId)); if (selectedResource?.resourceId === deletingResourceId) { setSelectedResource(null); setResourceAttributes([]); } setDeleteConfirmOpen(false); setDeletingResourceId(null); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete resource'); }
    finally { setIsSaving(false); }
  };

  const handleStartEdit = (resource: Resource) => {
    setEditingResource(resource);
    setEditResourceData({ resourceName: resource.resourceName, resourceTypeId: resource.resourceTypeId });
    setIsEditDialogOpen(true);
  };

  const handleEditResource = async () => {
    if (!editingResource || !editResourceData.resourceName) return;
    setIsSaving(true);
    try { const updated = await api.updateResource(editingResource.resourceId, { resourceName: editResourceData.resourceName, resourceTypeId: editResourceData.resourceTypeId }); setResources(prev => prev.map(r => r.resourceId === editingResource.resourceId ? updated : r)); if (selectedResource?.resourceId === editingResource.resourceId) { setSelectedResource(updated); } setIsEditDialogOpen(false); setEditingResource(null); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to update resource'); }
    finally { setIsSaving(false); }
  };

  const handleAddAttribute = async () => {
    if (!selectedResource || !newAttribute.attributeId || !newAttribute.attributeValue) return;
    setIsSaving(true);
    try { const created = await api.createResourceAttribute({ resourceId: selectedResource.resourceId, attributeId: newAttribute.attributeId, attributeValue: newAttribute.attributeValue, effectiveFrom: newAttribute.effectiveFrom, effectiveTo: newAttribute.effectiveTo }); setResourceAttributes(prev => [...prev, created]); setIsAddAttributeDialogOpen(false); setNewAttribute({}); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to add attribute'); }
    finally { setIsSaving(false); }
  };

  const handleDeleteAttribute = async () => {
    if (!deletingAttrId) return;
    setIsSaving(true);
    try { await api.deleteResourceAttribute(deletingAttrId); setResourceAttributes(prev => prev.filter(a => a.resourceAttributeId !== deletingAttrId)); setDeleteAttrConfirmOpen(false); setDeletingAttrId(null); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete attribute'); }
    finally { setIsSaving(false); }
  };

  const getAttributeName = (attrDefId: string) => { const def = attributeDefinitions.find(d => d.attributeId === attrDefId); return def?.attributeName || 'Unknown'; };

  const resourcesColumns = useMemo<MRT_ColumnDef<Resource>[]>(() => [
    { accessorKey: 'resourceName', header: 'Resource', Cell: ({ row }) => (<div><div style={{ fontWeight: 500 }}>{row.original.resourceName}</div><div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{new Date(row.original.createdAt).toLocaleDateString()}</div></div>) },
    { accessorKey: 'resourceTypeName', header: 'Type', Cell: ({ cell }) => <span style={{ ...styles.badge, ...styles.badgeInfo }}>{cell.getValue<string>()}</span> },
    { accessorKey: 'isActive', header: 'Status', Cell: ({ cell }) => <span style={{ ...styles.badge, ...(cell.getValue<boolean>() ? styles.badgeSuccess : styles.badgeDanger) }}>{cell.getValue<boolean>() ? 'Active' : 'Inactive'}</span> },
    { id: 'actions', header: 'Actions', enableColumnFilter: false, enableSorting: false, Cell: ({ row }) => (
      <div style={styles.actionButtons}>
        <button onClick={(e) => { e.stopPropagation(); handleStartEdit(row.original); }} style={{ ...styles.iconButton, color: 'var(--color-primary)' }} title="Edit"><Pencil size={16} /></button>
        <button onClick={(e) => { e.stopPropagation(); setDeletingResourceId(row.original.resourceId); setDeleteConfirmOpen(true); }} style={{ ...styles.iconButton, color: '#dc2626' }} title="Delete"><Trash2 size={16} /></button>
      </div>
    ) },
  ], []);

  const resourcesTable = useMantineReactTable({
    columns: resourcesColumns, data: resources,
    enableColumnFilters: true, enableGlobalFilter: true, enableSorting: true, enablePagination: true,
    enableColumnOrdering: true, enableFullScreenToggle: false, enableDensityToggle: true, enableStickyHeader: true,
    enableColumnResizing: true, layoutMode: 'semantic',
    initialState: { density: 'xs', showGlobalFilter: true, pagination: { pageSize: 10, pageIndex: 0 } },
    paginationDisplayMode: 'pages',
    state: { isLoading, showAlertBanner: !!error },
    mantineToolbarAlertBannerProps: error ? { color: 'red', children: error } : undefined,
    mantineTableProps: { striped: true, withTableBorder: true, withColumnBorders: true },
    mantineTableHeadCellProps: { align: 'center' }, mantineTableBodyCellProps: { align: 'center' },
    mantineTableBodyRowProps: ({ row }) => ({
      onClick: () => handleSelectResource(row.original),
      style: { cursor: 'pointer', backgroundColor: selectedResource?.resourceId === row.original.resourceId ? 'var(--color-primary-light)' : undefined },
    }),
    renderTopToolbarCustomActions: () => (
      <Box style={{ display: 'flex', gap: '16px', padding: '8px' }}>
        <button onClick={loadData} style={{ ...styles.button, ...styles.secondaryButton }}><RefreshCw size={16} /></button>
        <button onClick={() => setIsCreateDialogOpen(true)} style={{ ...styles.button, ...styles.primaryButton }}><Plus size={16} /> New Resource</button>
      </Box>
    ),
  });

  const resAttrColumns = useMemo<MRT_ColumnDef<ResourceAttribute>[]>(() => [
    { accessorFn: (row) => row.attributeName || getAttributeName(row.attributeId), id: 'attributeName', header: 'Attribute', Cell: ({ renderedCellValue }) => <div style={{ fontWeight: 500 }}>{renderedCellValue}</div> },
    { accessorKey: 'attributeValue', header: 'Value', Cell: ({ cell }) => <span style={{ ...styles.badge, ...styles.badgeInfo }}>{cell.getValue<string>()}</span> },
    { accessorKey: 'isActive', header: 'Status', Cell: ({ cell }) => <span style={{ ...styles.badge, ...(cell.getValue<boolean>() ? styles.badgeSuccess : styles.badgeDanger) }}>{cell.getValue<boolean>() ? 'Active' : 'Inactive'}</span> },
    { id: 'actions', header: 'Actions', enableColumnFilter: false, enableSorting: false, Cell: ({ row }) => (
      <div style={styles.actionButtons}><button onClick={() => { setDeletingAttrId(row.original.resourceAttributeId); setDeleteAttrConfirmOpen(true); }} style={{ ...styles.iconButton, color: '#dc2626' }} title="Delete"><Trash2 size={16} /></button></div>
    ) },
  ], [attributeDefinitions]);

  const resAttrTable = useMantineReactTable({
    columns: resAttrColumns, data: resourceAttributes,
    enablePagination: false, enableColumnFilters: false, enableGlobalFilter: false, enableSorting: true,
    enableFullScreenToggle: false, enableDensityToggle: false, enableTopToolbar: false, enableBottomToolbar: false,
    mantineTableProps: { striped: true, withTableBorder: true, withColumnBorders: true },
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
      <div style={styles.card}><MantineReactTable table={resourcesTable} /></div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}><Key size={18} style={{ marginRight: '8px', display: 'inline' }} />{selectedResource ? `Attributes for ${selectedResource.resourceName}` : 'Select a Resource'}</h3>
          {selectedResource && (<button onClick={() => setIsAddAttributeDialogOpen(true)} style={{ ...styles.button, ...styles.primaryButton }}><Plus size={16} /> Add Attribute</button>)}
        </div>
        <div style={styles.cardBody}>
          {!selectedResource ? (
            <div style={styles.emptyState}><Package size={48} style={{ marginBottom: 'var(--spacing-md)', opacity: 0.5 }} /><p>Select a resource to view and manage its attributes</p></div>
          ) : isLoadingAttributes ? (
            <div style={styles.loadingContainer}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /><span>Loading attributes...</span></div>
          ) : (
            <MantineReactTable table={resAttrTable} />
          )}
        </div>
      </div>

      {/* Create Resource Dialog */}
      <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <Dialog.Portal><Dialog.Overlay style={styles.dialogOverlay} /><Dialog.Content style={styles.dialogContent}>
          <Dialog.Title style={styles.dialogTitle}>Create New Resource</Dialog.Title>
          <div style={styles.formGroup}><label style={styles.label}>Resource Name *</label><input type="text" value={newResource.resourceName} onChange={(e) => setNewResource(prev => ({ ...prev, resourceName: e.target.value }))} style={styles.input} placeholder="e.g., timesheets, users, reports" /></div>
          <div style={styles.formGroup}><label style={styles.label}>Resource Type *</label><select value={newResource.resourceTypeId} onChange={(e) => setNewResource(prev => ({ ...prev, resourceTypeId: Number(e.target.value) }))} style={styles.select}><option value={1}>Page</option><option value={2}>API Endpoint</option><option value={3}>Data Entity</option><option value={4}>Component</option></select></div>
          <div style={styles.dialogActions}>
            <Dialog.Close asChild><button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button></Dialog.Close>
            <button onClick={handleCreate} disabled={isSaving || !newResource.resourceName} style={{ ...styles.button, ...styles.primaryButton, opacity: isSaving || !newResource.resourceName ? 0.6 : 1 }}>{isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />} {isSaving ? 'Creating...' : 'Create Resource'}</button>
          </div>
        </Dialog.Content></Dialog.Portal>
      </Dialog.Root>

      {/* Edit Resource Dialog */}
      <Dialog.Root open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <Dialog.Portal><Dialog.Overlay style={styles.dialogOverlay} /><Dialog.Content style={styles.dialogContent}>
          <Dialog.Title style={styles.dialogTitle}>Edit Resource</Dialog.Title>
          <div style={styles.formGroup}><label style={styles.label}>Resource Name *</label><input type="text" value={editResourceData.resourceName} onChange={(e) => setEditResourceData(prev => ({ ...prev, resourceName: e.target.value }))} style={styles.input} placeholder="e.g., timesheets, users, reports" /></div>
          <div style={styles.formGroup}><label style={styles.label}>Resource Type *</label><select value={editResourceData.resourceTypeId} onChange={(e) => setEditResourceData(prev => ({ ...prev, resourceTypeId: Number(e.target.value) }))} style={styles.select}><option value={1}>Page</option><option value={2}>API Endpoint</option><option value={3}>Data Entity</option><option value={4}>Component</option></select></div>
          <div style={styles.dialogActions}>
            <Dialog.Close asChild><button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button></Dialog.Close>
            <button onClick={handleEditResource} disabled={isSaving || !editResourceData.resourceName} style={{ ...styles.button, ...styles.primaryButton, opacity: isSaving || !editResourceData.resourceName ? 0.6 : 1 }}>{isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Pencil size={16} />} {isSaving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </Dialog.Content></Dialog.Portal>
      </Dialog.Root>

      {/* Add Resource Attribute Dialog */}
      <Dialog.Root open={isAddAttributeDialogOpen} onOpenChange={setIsAddAttributeDialogOpen}>
        <Dialog.Portal><Dialog.Overlay style={styles.dialogOverlay} /><Dialog.Content style={styles.dialogContent}>
          <Dialog.Title style={styles.dialogTitle}>Add Attribute to {selectedResource?.resourceName}</Dialog.Title>
          <div style={styles.formGroup}><label style={styles.label}>Attribute Definition *</label><select value={newAttribute.attributeId || ''} onChange={(e) => setNewAttribute(prev => ({ ...prev, attributeId: e.target.value }))} style={styles.select}><option value="">Select an attribute...</option>{attributeDefinitions.map(def => (<option key={def.attributeId} value={def.attributeId}>{def.attributeName} ({def.dataTypeName})</option>))}</select></div>
          <div style={styles.formGroup}><label style={styles.label}>Value *</label><input type="text" value={newAttribute.attributeValue || ''} onChange={(e) => setNewAttribute(prev => ({ ...prev, attributeValue: e.target.value }))} style={styles.input} placeholder="Enter attribute value" /></div>
          <div style={styles.formGroup}><label style={styles.label}>Effective From</label><input type="date" value={newAttribute.effectiveFrom || ''} onChange={(e) => setNewAttribute(prev => ({ ...prev, effectiveFrom: e.target.value }))} style={styles.input} /></div>
          <div style={styles.formGroup}><label style={styles.label}>Effective To</label><input type="date" value={newAttribute.effectiveTo || ''} onChange={(e) => setNewAttribute(prev => ({ ...prev, effectiveTo: e.target.value }))} style={styles.input} /></div>
          <div style={styles.dialogActions}>
            <Dialog.Close asChild><button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button></Dialog.Close>
            <button onClick={handleAddAttribute} disabled={isSaving || !newAttribute.attributeId || !newAttribute.attributeValue} style={{ ...styles.button, ...styles.primaryButton, opacity: isSaving || !newAttribute.attributeId || !newAttribute.attributeValue ? 0.6 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}>{isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />} {isSaving ? 'Saving...' : 'Add Attribute'}</button>
          </div>
        </Dialog.Content></Dialog.Portal>
      </Dialog.Root>

      {/* Delete Resource Confirmation */}
      <AlertDialog.Root open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialog.Portal><AlertDialog.Overlay style={styles.dialogOverlay} /><AlertDialog.Content style={styles.dialogContent}>
          <AlertDialog.Title style={styles.dialogTitle}>Delete Resource</AlertDialog.Title>
          <AlertDialog.Description style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>Are you sure you want to delete this resource? This may affect policies that reference it.</AlertDialog.Description>
          <div style={styles.dialogActions}><AlertDialog.Cancel asChild><button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button></AlertDialog.Cancel><AlertDialog.Action asChild><button onClick={handleDelete} disabled={isSaving} style={{ ...styles.button, ...styles.dangerButton }}>{isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={16} />} {isSaving ? 'Deleting...' : 'Delete'}</button></AlertDialog.Action></div>
        </AlertDialog.Content></AlertDialog.Portal>
      </AlertDialog.Root>

      {/* Delete Attribute Confirmation */}
      <AlertDialog.Root open={deleteAttrConfirmOpen} onOpenChange={setDeleteAttrConfirmOpen}>
        <AlertDialog.Portal><AlertDialog.Overlay style={styles.dialogOverlay} /><AlertDialog.Content style={styles.dialogContent}>
          <AlertDialog.Title style={styles.dialogTitle}>Delete Attribute</AlertDialog.Title>
          <AlertDialog.Description style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>Are you sure you want to delete this attribute from the resource? This action cannot be undone.</AlertDialog.Description>
          <div style={styles.dialogActions}><AlertDialog.Cancel asChild><button style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button></AlertDialog.Cancel><AlertDialog.Action asChild><button onClick={handleDeleteAttribute} disabled={isSaving} style={{ ...styles.button, ...styles.dangerButton }}>{isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={16} />} {isSaving ? 'Deleting...' : 'Delete'}</button></AlertDialog.Action></div>
        </AlertDialog.Content></AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
