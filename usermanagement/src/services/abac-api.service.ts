/**
 * ABAC API Service
 * Comprehensive service for all ABAC API endpoints
 * Copied from administrationmanagement (most up-to-date version)
 * Adapted imports for usermanagement module
 */

import {
  HttpClient,
  CommonService,
  ApiResponse,
} from './common.services';

// ============================================================================
// Base Types (inlined from administrationmanagement/types)
// ============================================================================

export type UUID = string;

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

// ============================================================================
// ABAC Types (Service-specific types with numeric IDs for lookup tables)
// ============================================================================

export interface AbacUser {
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

export interface Operation {
  operationId: UUID;
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
  attributeId: UUID;
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
  resourceAttributeId: UUID;
  resourceId: UUID;
  attributeId: UUID;
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
  attributeId: UUID;
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
  attributeId: UUID;
  attributeName?: string;
  operator: RuleOperator;
  comparisonValue: string;
  logicalOperator: LogicalOperator;
  ruleOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePolicyRuleRequest {
  policyId: UUID;
  attributeId: UUID;
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
  userId: UUID;
  resourceId: UUID;
  operationId: UUID;
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

class UsersApiService extends CommonService<AbacUser> {
  constructor(client: HttpClient) {
    super(client, 'users');
  }

  async getUserByUsername(username: string): Promise<ApiResponse<AbacUser>> {
    return this.client.get<AbacUser>(`/users/username/${username}`);
  }

  async getActiveUsers(): Promise<ApiResponse<AbacUser[]>> {
    return this.client.get<AbacUser[]>('/users/active');
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

  async getOperationsForPolicy(policyId: UUID): Promise<ApiResponse<Operation[]>> {
    return this.client.get<Operation[]>(`/policies/${policyId}/operations`);
  }

  async getResourcesForPolicy(policyId: UUID): Promise<ApiResponse<Resource[]>> {
    return this.client.get<Resource[]>(`/policies/${policyId}/resources`);
  }

  async addOperationToPolicy(policyId: UUID, operationId: UUID): Promise<ApiResponse<void>> {
    return this.client.post<void>(`/policies/${policyId}/operations/${operationId}`);
  }

  async removeOperationFromPolicy(policyId: UUID, operationId: UUID): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/policies/${policyId}/operations/${operationId}`);
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
  // Convenience Methods
  // =========================================================================

  async getAllResources(): Promise<Resource[]> {
    const response = await this.resources.getAll();
    return response.data || [];
  }

  async getActiveResources(): Promise<Resource[]> {
    const response = await this.resources.getActiveResources();
    return response.data || [];
  }

  async getResourcesByType(resourceTypeId: number): Promise<Resource[]> {
    const response = await this.resources.getResourcesByType(resourceTypeId);
    return response.data || [];
  }

  async getAllOperations(): Promise<Operation[]> {
    const response = await this.operations.getAll();
    return response.data || [];
  }

  async getOperationByName(name: string): Promise<Operation> {
    const response = await this.operations.getOperationByName(name);
    if (!response.success || !response.data) {
      throw new Error('Operation not found');
    }
    return response.data;
  }

  async getActivePolicies(): Promise<Policy[]> {
    const response = await this.policies.getActivePolicies();
    return response.data || [];
  }

  async getRulesByPolicyId(policyId: UUID): Promise<PolicyRule[]> {
    const response = await this.policyRules.getRulesByPolicyId(policyId);
    return response.data || [];
  }

  async getResolvedAttributesByUserId(userId: number): Promise<SubjectAttribute[]> {
    const response = await this.subjectAttributes.getResolvedAttributesByUserId(userId);
    return response.data || [];
  }

  async getActiveSubjectAttributesByUserId(userId: UUID): Promise<SubjectAttribute[]> {
    const response = await this.subjectAttributes.getResolvedAttributesByUserId(Number(userId));
    return response.data || [];
  }

  async getActiveResourceAttributesByResourceId(resourceId: UUID): Promise<ResourceAttribute[]> {
    const response = await this.resourceAttributes.getActiveResourceAttributesByResourceId(resourceId);
    return response.data || [];
  }

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
