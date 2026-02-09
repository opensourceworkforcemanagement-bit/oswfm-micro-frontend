/**
 * ABAC Permission Management Page (MantineReactTable version)
 * Allows administrators to create and assign permissions to users using ABAC
 * 
 * Main component that orchestrates all modular ABAC panels
 */

import React, { useState } from 'react';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import 'mantine-react-table/styles.css';
import * as Tabs from '@radix-ui/react-tabs';
import {
  Users,
  Shield,
  FileText,
  Settings,
  Key,
  Target,
  Zap,
  Package,
} from 'lucide-react';

import { AbacProvider } from '../hooks/AbacProvider';
import {
  SubjectAttributesPanel,
  UserPermissionsPanel,
  UserGroupsPanel,
  PolicyManagementPanel,
  ActionsManagementPanel,
  ResourcesManagementPanel,
  AttributeDefinitionsPanel,
  styles,
} from '../components';
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
// Page-Level Styles (Tab Navigation Only)
// ============================================================================

const pageStyles = {
  tabsRoot: {
    display: 'flex',
    flexDirection: 'column' as const,
    width: '100%',
    height: '100%',
  } as React.CSSProperties,
  tabsList: {
    display: 'flex',
    borderBottom: '2px solid var(--color-border)',
    backgroundColor: 'var(--color-background)',
    padding: '0 var(--spacing-md)',
    gap: 'var(--spacing-lg)',
    overflowX: 'auto' as const,
    minHeight: '56px',
    alignItems: 'center',
  } as React.CSSProperties,
  tabsTrigger: {
    padding: 'var(--spacing-md) var(--spacing-lg)',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--color-text-secondary)',
    transition: 'all 0.2s ease',
    borderBottom: '3px solid transparent',
    marginBottom: '-2px',
    height: '56px',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  tabsTriggerActive: {
    color: 'var(--color-primary)',
    borderBottomColor: 'var(--color-primary)',
  } as React.CSSProperties,
  tabsContent: {
    flex: 1,
    overflow: 'auto',
    padding: '0',
  } as React.CSSProperties,
};

// ============================================================================
// Tab Configuration
// ============================================================================

const TABS: TabItem[] = [
  { id: 'subject-attrs', label: 'Subject Attributes', icon: <Key size={18} /> },
  { id: 'users', label: 'User Permissions', icon: <Users size={18} /> },
  { id: 'groups', label: 'User Groups', icon: <Users size={18} /> },
  { id: 'policies', label: 'Policies & Rules', icon: <Shield size={18} /> },
  { id: 'actions', label: 'Actions', icon: <Zap size={18} /> },
  { id: 'resources', label: 'Resources', icon: <Package size={18} /> },
  { id: 'attributes', label: 'Attribute Definitions', icon: <Settings size={18} /> },
];

// ============================================================================
// Inner Component (with hooks - requires provider context)
// ============================================================================

interface MTAbacPermissionManagementInnerProps {
  theme?: string;
}

const MTAbacPermissionManagementInner: React.FC<MTAbacPermissionManagementInnerProps> = ({
  theme = 'light',
}) => {
  const [activeTab, setActiveTab] = useState('subject-attrs');

  return (
    <div className={commonClasses.pageContainer}>
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} style={pageStyles.tabsRoot}>
        {/* Tab List */}
        <Tabs.List style={pageStyles.tabsList}>
          {TABS.map(tab => (
            <Tabs.Trigger
              key={tab.id}
              value={tab.id}
              style={{
                ...pageStyles.tabsTrigger,
                ...(activeTab === tab.id ? pageStyles.tabsTriggerActive : {}),
              }}
            >
              {tab.icon}
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Tab Contents */}
        <Tabs.Content value="subject-attrs" style={pageStyles.tabsContent}>
          <SubjectAttributesPanel />
        </Tabs.Content>

        <Tabs.Content value="users" style={pageStyles.tabsContent}>
          <UserPermissionsPanel />
        </Tabs.Content>

        <Tabs.Content value="groups" style={pageStyles.tabsContent}>
          <UserGroupsPanel />
        </Tabs.Content>

        <Tabs.Content value="policies" style={pageStyles.tabsContent}>
          <PolicyManagementPanel />
        </Tabs.Content>

        <Tabs.Content value="actions" style={pageStyles.tabsContent}>
          <ActionsManagementPanel />
        </Tabs.Content>

        <Tabs.Content value="resources" style={pageStyles.tabsContent}>
          <ResourcesManagementPanel />
        </Tabs.Content>

        <Tabs.Content value="attributes" style={pageStyles.tabsContent}>
          <AttributeDefinitionsPanel />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};

// ============================================================================
// Outer Component (provides context)
// ============================================================================

interface AbacPermissionManagementProps {
  theme?: string;
  apiBaseUrl?: string;
}

export const MTAbacPermissionManagement: React.FC<AbacPermissionManagementProps> = ({
  theme = 'light',
  apiBaseUrl = 'http://localhost:1110/api/v1',
}) => {
  return (
    <MantineProvider>
      <AbacProvider apiBaseUrl={apiBaseUrl || ''}>
        <MTAbacPermissionManagementInner theme={theme} />
      </AbacProvider>
    </MantineProvider>
  );
};

// Export as default
export default MTAbacPermissionManagement;

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
