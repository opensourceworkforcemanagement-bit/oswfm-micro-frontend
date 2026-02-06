/**
 * Base ABAC Types
 * Core TypeScript types matching the backend entities
 */

export type UUID = string;

export interface BaseEntity {
  createdAt: string;
  updatedAt?: string;
}

// ============================================================================
// User / Subject Types
// ============================================================================

export interface User extends BaseEntity {
  userId: UUID;
  username: string;
  email: string;
  fullName?: string;
  isActive: boolean;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  fullName?: string;
  isActive?: boolean;
}

export interface UpdateUserRequest extends CreateUserRequest {}

// ============================================================================
// Resource Types
// ============================================================================

export interface Resource extends BaseEntity {
  resourceId: UUID;
  resourceType: string;
  resourceName: string;
  resourceUri?: string;
  ownerId?: UUID;
  ownerUsername?: string;
  isActive: boolean;
}

export interface CreateResourceRequest {
  resourceType: string;
  resourceName: string;
  resourceUri?: string;
  ownerId?: UUID;
  isActive?: boolean;
}

export interface UpdateResourceRequest extends CreateResourceRequest {}

// ============================================================================
// Action Types
// ============================================================================

export interface Action extends BaseEntity {
  actionId: UUID;
  actionName: string;
  description?: string;
}

export interface CreateActionRequest {
  actionName: string;
  description?: string;
}

export interface UpdateActionRequest extends CreateActionRequest {}

// ============================================================================
// Attribute Definition Types
// ============================================================================

export type AttributeCategory = 'subject' | 'resource' | 'environment' | 'action';
export type AttributeDataType = 'string' | 'number' | 'boolean' | 'datetime' | 'list';

export interface AttributeDefinition extends BaseEntity {
  attributeId: UUID;
  attributeName: string;
  attributeCategory: AttributeCategory;
  dataType: AttributeDataType;
  description?: string;
  isRequired: boolean;
}

export interface CreateAttributeDefinitionRequest {
  attributeName: string;
  attributeCategory: AttributeCategory;
  dataType: AttributeDataType;
  description?: string;
  isRequired?: boolean;
}

export interface UpdateAttributeDefinitionRequest extends CreateAttributeDefinitionRequest {}

// ============================================================================
// Subject Attribute Types
// ============================================================================

export interface SubjectAttribute extends BaseEntity {
  subjectAttrId: UUID;
  userId: UUID;
  username?: string;
  attributeId: UUID;
  attributeName?: string;
  attributeValue: string;
  validFrom: string;
  validUntil?: string;
}

export interface CreateSubjectAttributeRequest {
  userId: UUID;
  attributeId: UUID;
  attributeValue: string;
  validFrom?: string;
  validUntil?: string;
}

export interface UpdateSubjectAttributeRequest {
  attributeValue: string;
  validFrom?: string;
  validUntil?: string;
}

// ============================================================================
// Resource Attribute Types
// ============================================================================

export interface ResourceAttribute extends BaseEntity {
  resourceAttrId: UUID;
  resourceId: UUID;
  resourceName?: string;
  attributeId: UUID;
  attributeName?: string;
  attributeValue: string;
  validFrom: string;
  validUntil?: string;
}

export interface CreateResourceAttributeRequest {
  resourceId: UUID;
  attributeId: UUID;
  attributeValue: string;
  validFrom?: string;
  validUntil?: string;
}

export interface UpdateResourceAttributeRequest {
  attributeValue: string;
  validFrom?: string;
  validUntil?: string;
}

// ============================================================================
// Policy Types
// ============================================================================

export type PolicyType = 'permit' | 'deny';

export interface Policy extends BaseEntity {
  policyId: UUID;
  policyName: string;
  description?: string;
  policyType: PolicyType;
  priority: number;
  isActive: boolean;
  createdById?: UUID;
  createdByUsername?: string;
}

export interface CreatePolicyRequest {
  policyName: string;
  description?: string;
  policyType: PolicyType;
  priority?: number;
  isActive?: boolean;
  createdById?: UUID;
}

export interface UpdatePolicyRequest extends CreatePolicyRequest {}

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
  ruleName?: string;
  attributeId: UUID;
  attributeName?: string;
  operator: RuleOperator;
  comparisonValue: string;
  logicalOperator: LogicalOperator;
  ruleOrder: number;
}

export interface CreatePolicyRuleRequest {
  policyId: UUID;
  attributeId: UUID;
  ruleName?: string;
  operator: RuleOperator;
  comparisonValue: string;
  logicalOperator?: LogicalOperator;
  ruleOrder?: number;
}

export interface UpdatePolicyRuleRequest {
  ruleName?: string;
  operator: RuleOperator;
  comparisonValue: string;
  logicalOperator?: LogicalOperator;
  ruleOrder?: number;
}

// ============================================================================
// Access Decision Types
// ============================================================================

export type AccessDecision = 'PERMIT' | 'DENY' | 'NOT_APPLICABLE' | 'INDETERMINATE';

export interface AccessDecisionRequest {
  userId: UUID;
  resourceId: UUID;
  actionId: UUID;
  environmentAttributes?: Record<string, string>;
  sourceIp?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface AccessDecisionResponse {
  decision: AccessDecision;
  reason: string;
  appliedPolicyId?: UUID;
  appliedPolicyName?: string;
  timestamp: string;
  evaluationDetails: string[];
}

// ============================================================================
// Access Request (Audit) Types
// ============================================================================

export interface AccessRequest {
  requestId: UUID;
  userId: UUID;
  resourceId: UUID;
  actionId: UUID;
  decision: AccessDecision;
  decisionReason?: string;
  appliedPolicyId?: UUID;
  requestTimestamp: string;
  sourceIp?: string;
  userAgent?: string;
  sessionId?: string;
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
