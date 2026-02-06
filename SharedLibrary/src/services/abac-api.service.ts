/**
 * ABAC API Service
 * Comprehensive service for all ABAC API endpoints
 * Refactored to use HttpClient from commonServices
 * Follows SOLID principles and OWASP guidelines
 */

import {
  HttpClient,
  CommonService,
  ApiResponse,
} from './common.services';

// ============================================================================
// ABAC Types (imported from existing types)
// ============================================================================

export type UUID = string;

export interface User {
  userId: UUID;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface Resource {
  resourceId: UUID;
  resourceName: string;
  resourceTypeId: number;
  resourceTypeName: string;
  ownerId?: UUID;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface Action {
  actionId: UUID;
  actionName: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActionRequest {
  actionName: string;
  description?: string;
}

export interface UpdateActionRequest {
  actionName?: string;
  description?: string;
}

export interface AttributeDefinition {
  attributeDefinitionId: UUID;
  attributeName: string;
  attributeCategoryId: number;
  attributeCategoryName: string;
  dataTypeId: number;
  dataTypeName: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
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

export interface SubjectAttribute {
  subjectAttributeId: UUID;
  userId: UUID;
  attributeDefinitionId: UUID;
  attributeName?: string;
  attributeValue: string;
  isActive: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
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

export interface ResourceAttribute {
  resourceAttributeId: UUID;
  resourceId: UUID;
  attributeDefinitionId: UUID;
  attributeName?: string;
  attributeValue: string;
  isActive: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
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

export interface Policy {
  policyId: UUID;
  policyName: string;
  policyTypeId: number;
  policyTypeName: string;
  description?: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface PolicyRule {
  ruleId: UUID;
  policyId: UUID;
  attributeDefinitionId: UUID;
  attributeName?: string;
  operator: RuleOperator;
  comparisonValue: string;
  logicalOperator: 'AND' | 'OR';
  ruleOrder: number;
  createdAt: string;
  updatedAt: string;
}

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

export interface CreatePolicyRuleRequest {
  policyId: UUID;
  attributeDefinitionId: UUID;
  operator: RuleOperator;
  comparisonValue: string;
  logicalOperator?: 'AND' | 'OR';
  ruleOrder: number;
}

export interface UpdatePolicyRuleRequest {
  operator?: RuleOperator;
  comparisonValue?: string;
  logicalOperator?: 'AND' | 'OR';
  ruleOrder?: number;
}

export interface AccessDecisionRequest {
  userId: UUID;
  resourceId: UUID;
  actionId: UUID;
  environmentAttributes?: Record<string, string>;
}

export type AccessDecision = 'PERMIT' | 'DENY';

export interface AccessDecisionResponse {
  decision: AccessDecision;
  reason: string;
  appliedPolicyId?: UUID;
  appliedPolicyName?: string;
  evaluationDetails?: string[];
}

// ============================================================================
// Base Services using CommonService
// ============================================================================

class UsersApiService extends CommonService<User> {
  constructor(client: HttpClient) {
    super(client, 'users');
  }

  async getUserByUsername(username: string): Promise<ApiResponse<User>> {
    return this.client.get<User>(`/users/username/${username}`);
  }

  async getActiveUsers(): Promise<ApiResponse<User[]>> {
    return this.client.get<User[]>('/users/active');
  }
}

class ResourcesApiService extends CommonService<Resource> {
  constructor(client: HttpClient) {
    super(client, 'resources');
  }

  async getResourcesByType(resourceTypeId: number): Promise<ApiResponse<Resource[]>> {
    return this.client.get<Resource[]>(`/resources/type/${resourceTypeId}`);
  }

  async getActiveResources(): Promise<ApiResponse<Resource[]>> {
    return this.client.get<Resource[]>('/resources/active');
  }

  async getResourcesByOwner(ownerId: UUID): Promise<ApiResponse<Resource[]>> {
    return this.client.get<Resource[]>(`/resources/owner/${ownerId}`);
  }
}

class ActionsApiService extends CommonService<Action> {
  constructor(client: HttpClient) {
    super(client, 'actions');
  }

  async getActionByName(name: string): Promise<ApiResponse<Action>> {
    return this.client.get<Action>(`/actions/name/${name}`);
  }
}

class AttributeDefinitionsApiService extends CommonService<AttributeDefinition> {
  constructor(client: HttpClient) {
    super(client, 'attribute-definitions');
  }

  async getAttributeDefinitionByName(name: string): Promise<ApiResponse<AttributeDefinition>> {
    return this.client.get<AttributeDefinition>(`/attribute-definitions/name/${name}`);
  }

  async getAttributeDefinitionsByCategory(attributeCategoryId: number): Promise<ApiResponse<AttributeDefinition[]>> {
    return this.client.get<AttributeDefinition[]>(`/attribute-definitions/category/${attributeCategoryId}`);
  }
}

class SubjectAttributesApiService extends CommonService<SubjectAttribute> {
  constructor(client: HttpClient) {
    super(client, 'subject-attributes');
  }

  async getSubjectAttributesByUserId(userId: UUID): Promise<ApiResponse<SubjectAttribute[]>> {
    return this.client.get<SubjectAttribute[]>(`/subject-attributes/user/${userId}`);
  }

  async getActiveSubjectAttributesByUserId(userId: UUID): Promise<ApiResponse<SubjectAttribute[]>> {
    return this.client.get<SubjectAttribute[]>(`/subject-attributes/user/${userId}/active`);
  }
}

class ResourceAttributesApiService extends CommonService<ResourceAttribute> {
  constructor(client: HttpClient) {
    super(client, 'resource-attributes');
  }

  async getResourceAttributesByResourceId(resourceId: UUID): Promise<ApiResponse<ResourceAttribute[]>> {
    return this.client.get<ResourceAttribute[]>(`/resource-attributes/resource/${resourceId}`);
  }

  async getActiveResourceAttributesByResourceId(resourceId: UUID): Promise<ApiResponse<ResourceAttribute[]>> {
    return this.client.get<ResourceAttribute[]>(`/resource-attributes/resource/${resourceId}/active`);
  }
}

class PoliciesApiService extends CommonService<Policy> {
  constructor(client: HttpClient) {
    super(client, 'policies');
  }

  async getActivePolicies(): Promise<ApiResponse<Policy[]>> {
    return this.client.get<Policy[]>('/policies/active');
  }

  async getPoliciesByType(policyTypeId: number): Promise<ApiResponse<Policy[]>> {
    return this.client.get<Policy[]>(`/policies/type/${policyTypeId}`);
  }

  async addActionToPolicy(policyId: UUID, actionId: UUID): Promise<ApiResponse<void>> {
    return this.client.post<void>(`/policies/${policyId}/actions/${actionId}`);
  }

  async removeActionFromPolicy(policyId: UUID, actionId: UUID): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/policies/${policyId}/actions/${actionId}`);
  }

  async addResourceToPolicy(policyId: UUID, resourceId: UUID): Promise<ApiResponse<void>> {
    return this.client.post<void>(`/policies/${policyId}/resources/${resourceId}`);
  }

  async addResourceTypeToPolicy(policyId: UUID, resourceTypeId: number): Promise<ApiResponse<void>> {
    return this.client.post<void>(`/policies/${policyId}/resource-types/${resourceTypeId}`);
  }

  async removeResourceFromPolicy(policyId: UUID, resourceId: UUID): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/policies/${policyId}/resources/${resourceId}`);
  }
}

class PolicyRulesApiService extends CommonService<PolicyRule> {
  constructor(client: HttpClient) {
    super(client, 'policy-rules');
  }

  async getRulesByPolicyId(policyId: UUID): Promise<ApiResponse<PolicyRule[]>> {
    return this.client.get<PolicyRule[]>(`/policy-rules/policy/${policyId}`);
  }
}

// ============================================================================
// Main ABAC API Service (Facade Pattern)
// ============================================================================

export class AbacApiService {
  public readonly users: UsersApiService;
  public readonly resources: ResourcesApiService;
  public readonly actions: ActionsApiService;
  public readonly attributeDefinitions: AttributeDefinitionsApiService;
  public readonly subjectAttributes: SubjectAttributesApiService;
  public readonly resourceAttributes: ResourceAttributesApiService;
  public readonly policies: PoliciesApiService;
  public readonly policyRules: PolicyRulesApiService;

  constructor(private client: HttpClient) {
    this.users = new UsersApiService(client);
    this.resources = new ResourcesApiService(client);
    this.actions = new ActionsApiService(client);
    this.attributeDefinitions = new AttributeDefinitionsApiService(client);
    this.subjectAttributes = new SubjectAttributesApiService(client);
    this.resourceAttributes = new ResourceAttributesApiService(client);
    this.policies = new PoliciesApiService(client);
    this.policyRules = new PolicyRulesApiService(client);
  }

  // =========================================================================
  // Convenience Methods (Backward Compatibility)
  // =========================================================================

  // Users
  async getAllUsers(): Promise<User[]> {
    const response = await this.users.getAll();
    return response.data || [];
  }

  async getUserById(id: UUID): Promise<User> {
    const response = await this.users.getById(id);
    if (!response.success || !response.data) {
      throw new Error('User not found');
    }
    return response.data;
  }

  async getUserByUsername(username: string): Promise<User> {
    const response = await this.users.getUserByUsername(username);
    if (!response.success || !response.data) {
      throw new Error('User not found');
    }
    return response.data;
  }

  async getActiveUsers(): Promise<User[]> {
    const response = await this.users.getActiveUsers();
    return response.data || [];
  }

  async createUser(request: CreateUserRequest): Promise<User> {
    const response = await this.users.create(request);
    if (!response.success || !response.data) {
      throw new Error('Failed to create user');
    }
    return response.data;
  }

  async updateUser(id: UUID, request: UpdateUserRequest): Promise<User> {
    const response = await this.users.update(id, request);
    if (!response.success || !response.data) {
      throw new Error('Failed to update user');
    }
    return response.data;
  }

  async deleteUser(id: UUID): Promise<void> {
    await this.users.delete(id);
  }

  // Resources
  async getAllResources(): Promise<Resource[]> {
    const response = await this.resources.getAll();
    return response.data || [];
  }

  async getResourceById(id: UUID): Promise<Resource> {
    const response = await this.resources.getById(id);
    if (!response.success || !response.data) {
      throw new Error('Resource not found');
    }
    return response.data;
  }

  async getResourcesByType(resourceTypeId: number): Promise<Resource[]> {
    const response = await this.resources.getResourcesByType(resourceTypeId);
    return response.data || [];
  }

  async getActiveResources(): Promise<Resource[]> {
    const response = await this.resources.getActiveResources();
    return response.data || [];
  }

  async getResourcesByOwner(ownerId: UUID): Promise<Resource[]> {
    const response = await this.resources.getResourcesByOwner(ownerId);
    return response.data || [];
  }

  async createResource(request: CreateResourceRequest): Promise<Resource> {
    const response = await this.resources.create(request);
    if (!response.success || !response.data) {
      throw new Error('Failed to create resource');
    }
    return response.data;
  }

  async updateResource(id: UUID, request: UpdateResourceRequest): Promise<Resource> {
    const response = await this.resources.update(id, request);
    if (!response.success || !response.data) {
      throw new Error('Failed to update resource');
    }
    return response.data;
  }

  async deleteResource(id: UUID): Promise<void> {
    await this.resources.delete(id);
  }

  // Actions
  async getAllActions(): Promise<Action[]> {
    const response = await this.actions.getAll();
    return response.data || [];
  }

  async getActionById(id: UUID): Promise<Action> {
    const response = await this.actions.getById(id);
    if (!response.success || !response.data) {
      throw new Error('Action not found');
    }
    return response.data;
  }

  async getActionByName(name: string): Promise<Action> {
    const response = await this.actions.getActionByName(name);
    if (!response.success || !response.data) {
      throw new Error('Action not found');
    }
    return response.data;
  }

  async createAction(request: CreateActionRequest): Promise<Action> {
    const response = await this.actions.create(request);
    if (!response.success || !response.data) {
      throw new Error('Failed to create action');
    }
    return response.data;
  }

  async updateAction(id: UUID, request: UpdateActionRequest): Promise<Action> {
    const response = await this.actions.update(id, request);
    if (!response.success || !response.data) {
      throw new Error('Failed to update action');
    }
    return response.data;
  }

  async deleteAction(id: UUID): Promise<void> {
    await this.actions.delete(id);
  }

  // Attribute Definitions
  async getAllAttributeDefinitions(): Promise<AttributeDefinition[]> {
    const response = await this.attributeDefinitions.getAll();
    return response.data || [];
  }

  async getAttributeDefinitionById(id: UUID): Promise<AttributeDefinition> {
    const response = await this.attributeDefinitions.getById(id);
    if (!response.success || !response.data) {
      throw new Error('Attribute definition not found');
    }
    return response.data;
  }

  async getAttributeDefinitionByName(name: string): Promise<AttributeDefinition> {
    const response = await this.attributeDefinitions.getAttributeDefinitionByName(name);
    if (!response.success || !response.data) {
      throw new Error('Attribute definition not found');
    }
    return response.data;
  }

  async getAttributeDefinitionsByCategory(attributeCategoryId: number): Promise<AttributeDefinition[]> {
    const response = await this.attributeDefinitions.getAttributeDefinitionsByCategory(attributeCategoryId);
    return response.data || [];
  }

  async createAttributeDefinition(request: CreateAttributeDefinitionRequest): Promise<AttributeDefinition> {
    const response = await this.attributeDefinitions.create(request);
    if (!response.success || !response.data) {
      throw new Error('Failed to create attribute definition');
    }
    return response.data;
  }

  async updateAttributeDefinition(id: UUID, request: UpdateAttributeDefinitionRequest): Promise<AttributeDefinition> {
    const response = await this.attributeDefinitions.update(id, request);
    if (!response.success || !response.data) {
      throw new Error('Failed to update attribute definition');
    }
    return response.data;
  }

  async deleteAttributeDefinition(id: UUID): Promise<void> {
    await this.attributeDefinitions.delete(id);
  }

  // Subject Attributes
  async getAllSubjectAttributes(): Promise<SubjectAttribute[]> {
    const response = await this.subjectAttributes.getAll();
    return response.data || [];
  }

  async getSubjectAttributeById(id: UUID): Promise<SubjectAttribute> {
    const response = await this.subjectAttributes.getById(id);
    if (!response.success || !response.data) {
      throw new Error('Subject attribute not found');
    }
    return response.data;
  }

  async getSubjectAttributesByUserId(userId: UUID): Promise<SubjectAttribute[]> {
    const response = await this.subjectAttributes.getSubjectAttributesByUserId(userId);
    return response.data || [];
  }

  async getActiveSubjectAttributesByUserId(userId: UUID): Promise<SubjectAttribute[]> {
    const response = await this.subjectAttributes.getActiveSubjectAttributesByUserId(userId);
    return response.data || [];
  }

  async createSubjectAttribute(request: CreateSubjectAttributeRequest): Promise<SubjectAttribute> {
    const response = await this.subjectAttributes.create(request);
    if (!response.success || !response.data) {
      throw new Error('Failed to create subject attribute');
    }
    return response.data;
  }

  async updateSubjectAttribute(id: UUID, request: UpdateSubjectAttributeRequest): Promise<SubjectAttribute> {
    const response = await this.subjectAttributes.update(id, request);
    if (!response.success || !response.data) {
      throw new Error('Failed to update subject attribute');
    }
    return response.data;
  }

  async deleteSubjectAttribute(id: UUID): Promise<void> {
    await this.subjectAttributes.delete(id);
  }

  // Resource Attributes
  async getAllResourceAttributes(): Promise<ResourceAttribute[]> {
    const response = await this.resourceAttributes.getAll();
    return response.data || [];
  }

  async getResourceAttributeById(id: UUID): Promise<ResourceAttribute> {
    const response = await this.resourceAttributes.getById(id);
    if (!response.success || !response.data) {
      throw new Error('Resource attribute not found');
    }
    return response.data;
  }

  async getResourceAttributesByResourceId(resourceId: UUID): Promise<ResourceAttribute[]> {
    const response = await this.resourceAttributes.getResourceAttributesByResourceId(resourceId);
    return response.data || [];
  }

  async getActiveResourceAttributesByResourceId(resourceId: UUID): Promise<ResourceAttribute[]> {
    const response = await this.resourceAttributes.getActiveResourceAttributesByResourceId(resourceId);
    return response.data || [];
  }

  async createResourceAttribute(request: CreateResourceAttributeRequest): Promise<ResourceAttribute> {
    const response = await this.resourceAttributes.create(request);
    if (!response.success || !response.data) {
      throw new Error('Failed to create resource attribute');
    }
    return response.data;
  }

  async updateResourceAttribute(id: UUID, request: UpdateResourceAttributeRequest): Promise<ResourceAttribute> {
    const response = await this.resourceAttributes.update(id, request);
    if (!response.success || !response.data) {
      throw new Error('Failed to update resource attribute');
    }
    return response.data;
  }

  async deleteResourceAttribute(id: UUID): Promise<void> {
    await this.resourceAttributes.delete(id);
  }

  // Policies
  async getAllPolicies(): Promise<Policy[]> {
    const response = await this.policies.getAll();
    return response.data || [];
  }

  async getPolicyById(id: UUID): Promise<Policy> {
    const response = await this.policies.getById(id);
    if (!response.success || !response.data) {
      throw new Error('Policy not found');
    }
    return response.data;
  }

  async getActivePolicies(): Promise<Policy[]> {
    const response = await this.policies.getActivePolicies();
    return response.data || [];
  }

  async getPoliciesByType(policyTypeId: number): Promise<Policy[]> {
    const response = await this.policies.getPoliciesByType(policyTypeId);
    return response.data || [];
  }

  async createPolicy(request: CreatePolicyRequest): Promise<Policy> {
    const response = await this.policies.create(request);
    if (!response.success || !response.data) {
      throw new Error('Failed to create policy');
    }
    return response.data;
  }

  async updatePolicy(id: UUID, request: UpdatePolicyRequest): Promise<Policy> {
    const response = await this.policies.update(id, request);
    if (!response.success || !response.data) {
      throw new Error('Failed to update policy');
    }
    return response.data;
  }

  async deletePolicy(id: UUID): Promise<void> {
    await this.policies.delete(id);
  }

  // Policy Rules
  async getAllPolicyRules(): Promise<PolicyRule[]> {
    const response = await this.policyRules.getAll();
    return response.data || [];
  }

  async getPolicyRuleById(id: UUID): Promise<PolicyRule> {
    const response = await this.policyRules.getById(id);
    if (!response.success || !response.data) {
      throw new Error('Policy rule not found');
    }
    return response.data;
  }

  async getRulesByPolicyId(policyId: UUID): Promise<PolicyRule[]> {
    const response = await this.policyRules.getRulesByPolicyId(policyId);
    return response.data || [];
  }

  async createPolicyRule(request: CreatePolicyRuleRequest): Promise<PolicyRule> {
    const response = await this.policyRules.create(request);
    if (!response.success || !response.data) {
      throw new Error('Failed to create policy rule');
    }
    return response.data;
  }

  async updatePolicyRule(id: UUID, request: UpdatePolicyRuleRequest): Promise<PolicyRule> {
    const response = await this.policyRules.update(id, request);
    if (!response.success || !response.data) {
      throw new Error('Failed to update policy rule');
    }
    return response.data;
  }

  async deletePolicyRule(id: UUID): Promise<void> {
    await this.policyRules.delete(id);
  }

  // Policy Targets
  async addActionToPolicy(policyId: UUID, actionId: UUID): Promise<void> {
    await this.policies.addActionToPolicy(policyId, actionId);
  }

  async removeActionFromPolicy(policyId: UUID, actionId: UUID): Promise<void> {
    await this.policies.removeActionFromPolicy(policyId, actionId);
  }

  async addResourceToPolicy(policyId: UUID, resourceId: UUID): Promise<void> {
    await this.policies.addResourceToPolicy(policyId, resourceId);
  }

  async addResourceTypeToPolicy(policyId: UUID, resourceTypeId: number): Promise<void> {
    await this.policies.addResourceTypeToPolicy(policyId, resourceTypeId);
  }

  async removeResourceFromPolicy(policyId: UUID, resourceId: UUID): Promise<void> {
    await this.policies.removeResourceFromPolicy(policyId, resourceId);
  }

  // Access Evaluation
  async evaluateAccess(request: AccessDecisionRequest): Promise<AccessDecisionResponse> {
    const response = await this.client.post<AccessDecisionResponse>('/access/evaluate', request);
    if (!response.success || !response.data) {
      throw new Error('Access evaluation failed');
    }
    return response.data;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export const createAbacApiService = (client: HttpClient): AbacApiService => {
  return new AbacApiService(client);
};
