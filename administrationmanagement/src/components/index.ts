/**
 * ABAC Panel Components Exports
 * Centralized export file for all modular ABAC administration panels
 */

export { SubjectAttributesPanel, type SubjectAttributesPanelProps } from './SubjectAttributesPanel';
export { UserPermissionsPanel, type UserPermissionsPanelProps } from './UserPermissionsPanel';
export { UserGroupsPanel, type UserGroupsPanelProps } from './UserGroupsPanel';
export { PolicyManagementPanel, type PolicyManagementPanelProps } from './PolicyManagementPanel';
export { ActionsManagementPanel, type ActionsManagementPanelProps } from './ActionsManagementPanel';
export { ResourcesManagementPanel, type ResourcesManagementPanelProps } from './ResourcesManagementPanel';
export { AttributeDefinitionsPanel, type AttributeDefinitionsPanelProps } from './AttributeDefinitionsPanel';

// Shared utilities
export { styles } from './styles';
export { RULE_OPERATORS, LOGICAL_OPERATORS } from './constants';
