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

import {
  UUID,
  RuleOperator,
  LogicalOperator,
} from '../types';

// Re-export base types
export type { UUID, RuleOperator, LogicalOperator };

// ============================================================================
// ABAC Types (Service-specific types with numeric IDs for lookup tables)
// ============================================================================

export interface User {
  userId: number;
  userName: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  userStatus: number;
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
  resourceId: number;
  resourceName: string;
  resourceTypeId: number;
  resourceTypeName: string;
  ownerId?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourceRequest {
  resourceName: string;
  resourceTypeId: number;
  ownerId?: number;
}

export interface UpdateResourceRequest {
  resourceName?: string;
  resourceTypeId?: number;
  ownerId?: number;
  isActive?: boolean;
}

export interface Operation {
  operationId: number;
  operationName: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOperationRequest {
  operationName: string;
  description?: string;
}

export interface UpdateOperationRequest {
  operationName?: string;
  description?: string;
}

export interface AttributeDefinition {
  attributeId: number;
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
  subjectAttrId: number;
  attributeId: number;
  attributeName?: string;
  attributeValue: string;
  validFrom?: string;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubjectAttributeRequest {
  attributeId: number;
  attributeValue: string;
  validFrom?: string;
  validUntil?: string;
}

export interface UpdateSubjectAttributeRequest {
  attributeValue?: string;
  validFrom?: string;
  validUntil?: string;
}

// User-to-attribute assignment (direct)
export interface UserSubjectAttribute {
  id: number;
  userId: number;
  username?: string;
  subjectAttrId: number;
  attributeName?: string;
  attributeValue?: string;
  createdAt: string;
}

export interface AssignAttributeToUserRequest {
  userId: number;
  subjectAttrId: number;
}

// Group-to-attribute assignment
export interface GroupSubjectAttribute {
  id: number;
  groupId: number;
  groupName?: string;
  subjectAttrId: number;
  attributeName?: string;
  attributeValue?: string;
  createdAt: string;
}

export interface AssignAttributeToGroupRequest {
  groupId: number;
  subjectAttrId: number;
}

// User Groups
export interface UserGroup {
  groupId: number;
  groupName: string;
  description?: string;
  parentGroupId?: number;
  parentGroupName?: string;
  createdAt: string;
}

export interface CreateUserGroupRequest {
  groupName: string;
  description?: string;
  parentGroupId?: number;
}

export interface UpdateUserGroupRequest {
  groupName?: string;
  description?: string;
  parentGroupId?: number;
}

// User Group Memberships
export interface UserGroupMembership {
  membershipId: number;
  userId: number;
  username?: string;
  groupId: number;
  groupName?: string;
}

export interface AddUserToGroupRequest {
  userId: number;
  groupId: number;
}

export interface ResourceAttribute {
  resourceAttributeId: number;
  resourceId: number;
  attributeId: number;
  attributeName?: string;
  attributeValue: string;
  isActive: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourceAttributeRequest {
  resourceId: number;
  attributeId: number;
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
  policyId: number;
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
  ruleId: number;
  policyId: number;
  attributeId: number;
  attributeName?: string;
  operator: RuleOperator;
  comparisonValue: string;
  logicalOperator: LogicalOperator;
  ruleOrder: number;
  createdAt: string;
  updatedAt: string;
}

// RuleOperator is imported from '../types'

export interface CreatePolicyRuleRequest {
  policyId: number;
  attributeId: number;
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

export interface PolicyObligation {
  obligationId: number;
  policyId: number;
  obligationTypeId: number;
  obligationTypeName: string;
  obligationParams?: string;
  isMandatory: boolean;
  createdAt: string;
}

export interface CreatePolicyObligationRequest {
  policyId: number;
  obligationTypeId: number;
  obligationParams?: string;
  isMandatory?: boolean;
}

export interface UpdatePolicyObligationRequest {
  obligationTypeId: number;
  obligationParams?: string;
  isMandatory?: boolean;
}

export interface AccessDecisionRequest {
  userId: number;
  resourceId: number;
  operationId: number;
  environmentAttributes?: Record<string, string>;
}

export type AccessDecision = 'PERMIT' | 'DENY';

export interface AccessDecisionResponse {
  decision: AccessDecision;
  reason: string;
  appliedPolicyId?: number;
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

  async getResourcesByOwner(ownerId: number): Promise<ApiResponse<Resource[]>> {
    return this.client.get<Resource[]>(`/resources/owner/${ownerId}`);
  }
}

class OperationsApiService extends CommonService<Operation> {
  constructor(client: HttpClient) {
    super(client, 'operations');
  }

  async getOperationByName(name: string): Promise<ApiResponse<Operation>> {
    return this.client.get<Operation>(`/operations/name/${name}`);
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

  async getSubjectAttributesByUserId(userId: number): Promise<ApiResponse<SubjectAttribute[]>> {
    return this.client.get<SubjectAttribute[]>(`/subject-attributes/user/${userId}`);
  }

  async getActiveSubjectAttributesByUserId(userId: number): Promise<ApiResponse<SubjectAttribute[]>> {
    return this.client.get<SubjectAttribute[]>(`/subject-attributes/user/${userId}/active`);
  }

  async getResolvedAttributesByUserId(userId: number): Promise<ApiResponse<SubjectAttribute[]>> {
    return this.client.get<SubjectAttribute[]>(`/subject-attributes/user/${userId}/resolved`);
  }

  async getAttributesByGroupId(groupId: number): Promise<ApiResponse<GroupSubjectAttribute[]>> {
    return this.client.get<GroupSubjectAttribute[]>(`/subject-attributes/group/${groupId}`);
  }

  async assignToUser(request: AssignAttributeToUserRequest): Promise<ApiResponse<UserSubjectAttribute>> {
    return this.client.post<UserSubjectAttribute>('/subject-attributes/assign/user', request);
  }

  async removeFromUser(userId: number, subjectAttrId: number): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/subject-attributes/assign/user/${userId}/${subjectAttrId}`);
  }

  async assignToGroup(request: AssignAttributeToGroupRequest): Promise<ApiResponse<GroupSubjectAttribute>> {
    return this.client.post<GroupSubjectAttribute>('/subject-attributes/assign/group', request);
  }

  async removeFromGroup(groupId: number, subjectAttrId: number): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/subject-attributes/assign/group/${groupId}/${subjectAttrId}`);
  }
}

class UserGroupsApiService extends CommonService<UserGroup> {
  constructor(client: HttpClient) {
    super(client, 'user-groups');
  }

  async getMembersByGroupId(groupId: number): Promise<ApiResponse<UserGroupMembership[]>> {
    return this.client.get<UserGroupMembership[]>(`/user-groups/${groupId}/members`);
  }

  async getGroupsByUserId(userId: number): Promise<ApiResponse<UserGroupMembership[]>> {
    return this.client.get<UserGroupMembership[]>(`/user-groups/user/${userId}`);
  }

  async addUserToGroup(request: AddUserToGroupRequest): Promise<ApiResponse<UserGroupMembership>> {
    return this.client.post<UserGroupMembership>('/user-groups/members', request);
  }

  async removeUserFromGroup(membershipId: number): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/user-groups/members/${membershipId}`);
  }
}

class ResourceAttributesApiService extends CommonService<ResourceAttribute> {
  constructor(client: HttpClient) {
    super(client, 'resource-attributes');
  }

  async getResourceAttributesByResourceId(resourceId: number): Promise<ApiResponse<ResourceAttribute[]>> {
    return this.client.get<ResourceAttribute[]>(`/resource-attributes/resource/${resourceId}`);
  }

  async getActiveResourceAttributesByResourceId(resourceId: number): Promise<ApiResponse<ResourceAttribute[]>> {
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

  async getPoliciesForUser(userId: number): Promise<ApiResponse<Policy[]>> {
    return this.client.get<Policy[]>(`/access/policies/user/${userId}`);
  }

  async getPoliciesByType(policyTypeId: number): Promise<ApiResponse<Policy[]>> {
    return this.client.get<Policy[]>(`/policies/type/${policyTypeId}`);
  }

  async getOperationsForPolicy(policyId: number): Promise<ApiResponse<Operation[]>> {
    return this.client.get<Operation[]>(`/policies/${policyId}/operations`);
  }

  async getResourcesForPolicy(policyId: number): Promise<ApiResponse<Resource[]>> {
    return this.client.get<Resource[]>(`/policies/${policyId}/resources`);
  }

  async addOperationToPolicy(policyId: number, operationId: number): Promise<ApiResponse<void>> {
    return this.client.post<void>(`/policies/${policyId}/operations/${operationId}`);
  }

  async removeOperationFromPolicy(policyId: number, operationId: number): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/policies/${policyId}/operations/${operationId}`);
  }

  async addResourceToPolicy(policyId: number, resourceId: number): Promise<ApiResponse<void>> {
    return this.client.post<void>(`/policies/${policyId}/resources/${resourceId}`);
  }

  async addResourceTypeToPolicy(policyId: number, resourceTypeId: number): Promise<ApiResponse<void>> {
    return this.client.post<void>(`/policies/${policyId}/resource-types/${resourceTypeId}`);
  }

  async removeResourceFromPolicy(policyId: number, resourceId: number): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/policies/${policyId}/resources/${resourceId}`);
  }
}

class PolicyRulesApiService extends CommonService<PolicyRule> {
  constructor(client: HttpClient) {
    super(client, 'policy-rules');
  }

  async getRulesByPolicyId(policyId: number): Promise<ApiResponse<PolicyRule[]>> {
    return this.client.get<PolicyRule[]>(`/policy-rules/policy/${policyId}`);
  }
}

class PolicyObligationsApiService extends CommonService<PolicyObligation> {
  constructor(client: HttpClient) {
    super(client, 'policy-obligations');
  }

  async getObligationsByPolicyId(policyId: number): Promise<ApiResponse<PolicyObligation[]>> {
    return this.client.get<PolicyObligation[]>(`/policy-obligations/policy/${policyId}`);
  }

  async getObligationsByType(obligationTypeId: number): Promise<ApiResponse<PolicyObligation[]>> {
    return this.client.get<PolicyObligation[]>(`/policy-obligations/type/${obligationTypeId}`);
  }
}

// ============================================================================
// Main ABAC API Service (Facade Pattern)
// ============================================================================

export class AbacApiService {
  public readonly users: UsersApiService;
  public readonly resources: ResourcesApiService;
  public readonly operations: OperationsApiService;
  public readonly attributeDefinitions: AttributeDefinitionsApiService;
  public readonly subjectAttributes: SubjectAttributesApiService;
  public readonly resourceAttributes: ResourceAttributesApiService;
  public readonly policies: PoliciesApiService;
  public readonly policyRules: PolicyRulesApiService;
  public readonly policyObligations: PolicyObligationsApiService;
  public readonly userGroups: UserGroupsApiService;

  constructor(private client: HttpClient) {
    this.users = new UsersApiService(client);
    this.resources = new ResourcesApiService(client);
    this.operations = new OperationsApiService(client);
    this.attributeDefinitions = new AttributeDefinitionsApiService(client);
    this.subjectAttributes = new SubjectAttributesApiService(client);
    this.resourceAttributes = new ResourceAttributesApiService(client);
    this.policies = new PoliciesApiService(client);
    this.policyRules = new PolicyRulesApiService(client);
    this.policyObligations = new PolicyObligationsApiService(client);
    this.userGroups = new UserGroupsApiService(client);
  }

  // =========================================================================
  // Convenience Methods (Backward Compatibility)
  // =========================================================================

  // Users
  async getAllUsers(): Promise<User[]> {
    const response = await this.users.getAll();
    return response.data || [];
  }

  async getUserById(id: number): Promise<User> {
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
    const data = response.data as any;
    // Backend wraps response in CustomResponse { response: [...] }
    if (data && Array.isArray(data.response)) {
      return data.response;
    }
    return Array.isArray(data) ? data : [];
  }

  async createUser(request: CreateUserRequest): Promise<User> {
    const response = await this.users.create(request);
    if (!response.success || !response.data) {
      throw new Error('Failed to create user');
    }
    return response.data;
  }

  async updateUser(id: number, request: UpdateUserRequest): Promise<User> {
    const response = await this.users.update(id, request);
    if (!response.success || !response.data) {
      throw new Error('Failed to update user');
    }
    return response.data;
  }

  async deleteUser(id: number): Promise<void> {
    await this.users.delete(id);
  }

  // Resources
  async getAllResources(): Promise<Resource[]> {
    const response = await this.resources.getAll();
    return response.data || [];
  }

  async getResourceById(id: number): Promise<Resource> {
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

  async getResourcesByOwner(ownerId: number): Promise<Resource[]> {
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

  async updateResource(id: number, request: UpdateResourceRequest): Promise<Resource> {
    const response = await this.resources.update(id, request);
    if (!response.success || !response.data) {
      throw new Error('Failed to update resource');
    }
    return response.data;
  }

  async deleteResource(id: number): Promise<void> {
    await this.resources.delete(id);
  }

  // Operations
  async getAllOperations(): Promise<Operation[]> {
    const response = await this.operations.getAll();
    return response.data || [];
  }

  async getOperationById(id: number): Promise<Operation> {
    const response = await this.operations.getById(id);
    if (!response.success || !response.data) {
      throw new Error('Operation not found');
    }
    return response.data;
  }

  async getOperationByName(name: string): Promise<Operation> {
    const response = await this.operations.getOperationByName(name);
    if (!response.success || !response.data) {
      throw new Error('Operation not found');
    }
    return response.data;
  }

  async createOperation(request: CreateOperationRequest): Promise<Operation> {
    const response = await this.operations.create(request);
    if (!response.success || !response.data) {
      throw new Error('Failed to create operation');
    }
    return response.data;
  }

  async updateOperation(id: number, request: UpdateOperationRequest): Promise<Operation> {
    const response = await this.operations.update(id, request);
    if (!response.success || !response.data) {
      throw new Error('Failed to update operation');
    }
    return response.data;
  }

  async deleteOperation(id: number): Promise<void> {
    await this.operations.delete(id);
  }

  // Attribute Definitions
  async getAllAttributeDefinitions(): Promise<AttributeDefinition[]> {
    const response = await this.attributeDefinitions.getAll();
    return response.data || [];
  }

  async getAttributeDefinitionById(id: number): Promise<AttributeDefinition> {
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

  async updateAttributeDefinition(id: number, request: UpdateAttributeDefinitionRequest): Promise<AttributeDefinition> {
    const response = await this.attributeDefinitions.update(id, request);
    if (!response.success || !response.data) {
      throw new Error('Failed to update attribute definition');
    }
    return response.data;
  }

  async deleteAttributeDefinition(id: number): Promise<void> {
    await this.attributeDefinitions.delete(id);
  }

  // Subject Attributes
  async getAllSubjectAttributes(): Promise<SubjectAttribute[]> {
    const response = await this.subjectAttributes.getAll();
    return response.data || [];
  }

  async getSubjectAttributeById(id: number): Promise<SubjectAttribute> {
    const response = await this.subjectAttributes.getById(id);
    if (!response.success || !response.data) {
      throw new Error('Subject attribute not found');
    }
    return response.data;
  }

  async getSubjectAttributesByUserId(userId: number): Promise<SubjectAttribute[]> {
    const response = await this.subjectAttributes.getSubjectAttributesByUserId(userId);
    return response.data || [];
  }

  async getActiveSubjectAttributesByUserId(userId: number): Promise<SubjectAttribute[]> {
    const response = await this.subjectAttributes.getActiveSubjectAttributesByUserId(userId);
    return response.data || [];
  }

  async getResolvedAttributesByUserId(userId: number): Promise<SubjectAttribute[]> {
    const response = await this.subjectAttributes.getResolvedAttributesByUserId(userId);
    return response.data || [];
  }

  async getAttributesByGroupId(groupId: number): Promise<GroupSubjectAttribute[]> {
    const response = await this.subjectAttributes.getAttributesByGroupId(groupId);
    return response.data || [];
  }

  async createSubjectAttribute(request: CreateSubjectAttributeRequest): Promise<SubjectAttribute> {
    const response = await this.subjectAttributes.create(request);
    if (!response.success || !response.data) {
      throw new Error('Failed to create subject attribute');
    }
    return response.data;
  }

  async updateSubjectAttribute(id: number, request: UpdateSubjectAttributeRequest): Promise<SubjectAttribute> {
    const response = await this.subjectAttributes.update(id, request);
    if (!response.success || !response.data) {
      throw new Error('Failed to update subject attribute');
    }
    return response.data;
  }

  async deleteSubjectAttribute(id: number): Promise<void> {
    await this.subjectAttributes.delete(id);
  }

  async assignAttributeToUser(request: AssignAttributeToUserRequest): Promise<UserSubjectAttribute> {
    const response = await this.subjectAttributes.assignToUser(request);
    if (!response.success || !response.data) {
      throw new Error('Failed to assign attribute to user');
    }
    return response.data;
  }

  async removeAttributeFromUser(userId: number, subjectAttrId: number): Promise<void> {
    await this.subjectAttributes.removeFromUser(userId, subjectAttrId);
  }

  async assignAttributeToGroup(request: AssignAttributeToGroupRequest): Promise<GroupSubjectAttribute> {
    const response = await this.subjectAttributes.assignToGroup(request);
    if (!response.success || !response.data) {
      throw new Error('Failed to assign attribute to group');
    }
    return response.data;
  }

  async removeAttributeFromGroup(groupId: number, subjectAttrId: number): Promise<void> {
    await this.subjectAttributes.removeFromGroup(groupId, subjectAttrId);
  }

  // Resource Attributes
  async getAllResourceAttributes(): Promise<ResourceAttribute[]> {
    const response = await this.resourceAttributes.getAll();
    return response.data || [];
  }

  async getResourceAttributeById(id: number): Promise<ResourceAttribute> {
    const response = await this.resourceAttributes.getById(id);
    if (!response.success || !response.data) {
      throw new Error('Resource attribute not found');
    }
    return response.data;
  }

  async getResourceAttributesByResourceId(resourceId: number): Promise<ResourceAttribute[]> {
    const response = await this.resourceAttributes.getResourceAttributesByResourceId(resourceId);
    return response.data || [];
  }

  async getActiveResourceAttributesByResourceId(resourceId: number): Promise<ResourceAttribute[]> {
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

  async updateResourceAttribute(id: number, request: UpdateResourceAttributeRequest): Promise<ResourceAttribute> {
    const response = await this.resourceAttributes.update(id, request);
    if (!response.success || !response.data) {
      throw new Error('Failed to update resource attribute');
    }
    return response.data;
  }

  async deleteResourceAttribute(id: number): Promise<void> {
    await this.resourceAttributes.delete(id);
  }

  // Policies
  async getAllPolicies(): Promise<Policy[]> {
    const response = await this.policies.getAll();
    return response.data || [];
  }

  async getPolicyById(id: number): Promise<Policy> {
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

  async getPoliciesForUser(userId: number): Promise<Policy[]> {
    const response = await this.policies.getPoliciesForUser(userId);
    return response.data || [];
  }

  async createPolicy(request: CreatePolicyRequest): Promise<Policy> {
    const response = await this.policies.create(request);
    if (!response.success || !response.data) {
      throw new Error('Failed to create policy');
    }
    return response.data;
  }

  async updatePolicy(id: number, request: UpdatePolicyRequest): Promise<Policy> {
    const response = await this.policies.update(id, request);
    if (!response.success || !response.data) {
      throw new Error('Failed to update policy');
    }
    return response.data;
  }

  async deletePolicy(id: number): Promise<void> {
    await this.policies.delete(id);
  }

  // Policy Rules
  async getAllPolicyRules(): Promise<PolicyRule[]> {
    const response = await this.policyRules.getAll();
    return response.data || [];
  }

  async getPolicyRuleById(id: number): Promise<PolicyRule> {
    const response = await this.policyRules.getById(id);
    if (!response.success || !response.data) {
      throw new Error('Policy rule not found');
    }
    return response.data;
  }

  async getRulesByPolicyId(policyId: number): Promise<PolicyRule[]> {
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

  async updatePolicyRule(id: number, request: UpdatePolicyRuleRequest): Promise<PolicyRule> {
    const response = await this.policyRules.update(id, request);
    if (!response.success || !response.data) {
      throw new Error('Failed to update policy rule');
    }
    return response.data;
  }

  async deletePolicyRule(id: number): Promise<void> {
    await this.policyRules.delete(id);
  }

  // Policy Targets
  async getOperationsForPolicy(policyId: number): Promise<Operation[]> {
    const response = await this.policies.getOperationsForPolicy(policyId);
    return response.data || [];
  }

  async getResourcesForPolicy(policyId: number): Promise<Resource[]> {
    const response = await this.policies.getResourcesForPolicy(policyId);
    return response.data || [];
  }

  async addActionToPolicy(policyId: number, actionId: number): Promise<void> {
    await this.policies.addOperationToPolicy(policyId, actionId);
  }

  async removeActionFromPolicy(policyId: number, actionId: number): Promise<void> {
    await this.policies.removeOperationFromPolicy(policyId, actionId);
  }

  async addResourceToPolicy(policyId: number, resourceId: number): Promise<void> {
    await this.policies.addResourceToPolicy(policyId, resourceId);
  }

  async addResourceTypeToPolicy(policyId: number, resourceTypeId: number): Promise<void> {
    await this.policies.addResourceTypeToPolicy(policyId, resourceTypeId);
  }

  async removeResourceFromPolicy(policyId: number, resourceId: number): Promise<void> {
    await this.policies.removeResourceFromPolicy(policyId, resourceId);
  }

  // Policy Obligations
  async getAllPolicyObligations(): Promise<PolicyObligation[]> {
    const response = await this.policyObligations.getAll();
    return response.data || [];
  }

  async getPolicyObligationById(id: number): Promise<PolicyObligation> {
    const response = await this.policyObligations.getById(id as any);
    if (!response.success || !response.data) {
      throw new Error('Policy obligation not found');
    }
    return response.data;
  }

  async getObligationsByPolicyId(policyId: number): Promise<PolicyObligation[]> {
    const response = await this.policyObligations.getObligationsByPolicyId(policyId);
    return response.data || [];
  }

  async getObligationsByType(obligationTypeId: number): Promise<PolicyObligation[]> {
    const response = await this.policyObligations.getObligationsByType(obligationTypeId);
    return response.data || [];
  }

  async createPolicyObligation(request: CreatePolicyObligationRequest): Promise<PolicyObligation> {
    const response = await this.policyObligations.create(request);
    if (!response.success || !response.data) {
      throw new Error('Failed to create policy obligation');
    }
    return response.data;
  }

  async updatePolicyObligation(id: number, request: UpdatePolicyObligationRequest): Promise<PolicyObligation> {
    const response = await this.policyObligations.update(id as any, request);
    if (!response.success || !response.data) {
      throw new Error('Failed to update policy obligation');
    }
    return response.data;
  }

  async deletePolicyObligation(id: number): Promise<void> {
    await this.policyObligations.delete(id as any);
  }

  // User Groups
  async getAllUserGroups(): Promise<UserGroup[]> {
    const response = await this.userGroups.getAll();
    return response.data || [];
  }

  async getUserGroupById(id: number): Promise<UserGroup> {
    const response = await this.userGroups.getById(id);
    if (!response.success || !response.data) {
      throw new Error('User group not found');
    }
    return response.data;
  }

  async createUserGroup(request: CreateUserGroupRequest): Promise<UserGroup> {
    const response = await this.userGroups.create(request);
    if (!response.success || !response.data) {
      throw new Error('Failed to create user group');
    }
    return response.data;
  }

  async updateUserGroup(id: number, request: UpdateUserGroupRequest): Promise<UserGroup> {
    const response = await this.userGroups.update(id, request);
    if (!response.success || !response.data) {
      throw new Error('Failed to update user group');
    }
    return response.data;
  }

  async deleteUserGroup(id: number): Promise<void> {
    await this.userGroups.delete(id);
  }

  async getMembersByGroupId(groupId: number): Promise<UserGroupMembership[]> {
    const response = await this.userGroups.getMembersByGroupId(groupId);
    return response.data || [];
  }

  async getGroupsByUserId(userId: number): Promise<UserGroupMembership[]> {
    const response = await this.userGroups.getGroupsByUserId(userId);
    return response.data || [];
  }

  async addUserToGroup(request: AddUserToGroupRequest): Promise<UserGroupMembership> {
    const response = await this.userGroups.addUserToGroup(request);
    if (!response.success || !response.data) {
      throw new Error('Failed to add user to group');
    }
    return response.data;
  }

  async removeUserFromGroup(membershipId: number): Promise<void> {
    await this.userGroups.removeUserFromGroup(membershipId);
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