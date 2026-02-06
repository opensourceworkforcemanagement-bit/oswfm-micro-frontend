/**
 * Base ABAC Types
 * Core TypeScript types matching the backend entities
 * Updated to use numeric IDs for lookup tables (matching service definitions)
 */

export type UUID = string;

export interface BaseEntity {
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// User / Subject Types
// ============================================================================

export interface User extends BaseEntity {
  userId: UUID;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
}

export interface CreateUserRequest {
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

// ============================================================================
// Resource Types
// ============================================================================

export interface Resource extends BaseEntity {
  resourceId: UUID;
  resourceName: string;
  resourceTypeId: number;
  resourceTypeName: string;
  ownerId?: UUID;
  isActive: boolean;
}

export interface CreateResourceRequest {
  resourceName: string;
  resourceTypeId: number;
  ownerId?: UUID;
}

export interface UpdateResourceRequest {
  resourceName?: string;
  resourceTypeId?: number;
  ownerId?: UUID;
  isActive?: boolean;
}

// ============================================================================
// Operation Types (for access control)
// ============================================================================

export interface Operation extends BaseEntity {
  operationId: UUID;
  operationName: string;
  description?: string;
}

export interface CreateOperationRequest {
  operationName: string;
  description?: string;
}

export interface UpdateOperationRequest {
  operationName?: string;
  description?: string;
}

// ============================================================================
// Attribute Definition Types
// ============================================================================

export interface AttributeDefinition extends BaseEntity {
  attributeDefinitionId: UUID;
  attributeName: string;
  attributeCategoryId: number;
  attributeCategoryName: string;
  dataTypeId: number;
  dataTypeName: string;
  description?: string;
}

export interface CreateAttributeDefinitionRequest {
  attributeName: string;
  attributeCategoryId: number;
  dataTypeId: number;
  description?: string;
}

export interface UpdateAttributeDefinitionRequest {
  attributeName?: string;
  description?: string;
}

// ============================================================================
// Subject Attribute Types
// ============================================================================

export interface SubjectAttribute extends BaseEntity {
  subjectAttributeId: UUID;
  userId: UUID;
  attributeDefinitionId: UUID;
  attributeName?: string;
  attributeValue: string;
  isActive: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface CreateSubjectAttributeRequest {
  userId: UUID;
  attributeDefinitionId: UUID;
  attributeValue: string;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface UpdateSubjectAttributeRequest {
  attributeValue?: string;
  isActive?: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
}

// ============================================================================
// Resource Attribute Types
// ============================================================================

export interface ResourceAttribute extends BaseEntity {
  resourceAttributeId: UUID;
  resourceId: UUID;
  attributeDefinitionId: UUID;
  attributeName?: string;
  attributeValue: string;
  isActive: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface CreateResourceAttributeRequest {
  resourceId: UUID;
  attributeDefinitionId: UUID;
  attributeValue: string;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface UpdateResourceAttributeRequest {
  attributeValue?: string;
  isActive?: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
}

// ============================================================================
// Policy Types
// ============================================================================

export interface Policy extends BaseEntity {
  policyId: UUID;
  policyName: string;
  policyTypeId: number;
  policyTypeName: string;
  description?: string;
  priority: number;
  isActive: boolean;
}

export interface CreatePolicyRequest {
  policyName: string;
  policyTypeId: number;
  description?: string;
  priority: number;
}

export interface UpdatePolicyRequest {
  policyName?: string;
  description?: string;
  priority?: number;
  isActive?: boolean;
}

// ============================================================================
// Policy Rule Types
// ============================================================================

export type RuleOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'in'
  | 'not_in'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'starts_with'
  | 'ends_with';

export type LogicalOperator = 'AND' | 'OR';

export interface PolicyRule extends BaseEntity {
  ruleId: UUID;
  policyId: UUID;
  attributeDefinitionId: UUID;
  attributeName?: string;
  operator: RuleOperator;
  comparisonValue: string;
  logicalOperator: LogicalOperator;
  ruleOrder: number;
}

export interface CreatePolicyRuleRequest {
  policyId: UUID;
  attributeDefinitionId: UUID;
  operator: RuleOperator;
  comparisonValue: string;
  logicalOperator?: LogicalOperator;
  ruleOrder: number;
}

export interface UpdatePolicyRuleRequest {
  operator?: RuleOperator;
  comparisonValue?: string;
  logicalOperator?: LogicalOperator;
  ruleOrder?: number;
}

// ============================================================================
// Access Decision Types
// ============================================================================

export type AccessDecision = 'PERMIT' | 'DENY';

export interface AccessDecisionRequest {
  userId: UUID;
  resourceId: UUID;
  operationId: UUID;
  environmentAttributes?: Record<string, string>;
}

export interface AccessDecisionResponse {
  decision: AccessDecision;
  reason: string;
  appliedPolicyId?: UUID;
  appliedPolicyName?: string;
  evaluationDetails?: string[];
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiError {
  status: number;
  message: string;
  timestamp: string;
  errors?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
