/**
 * ABAC Services - Main Export File
 * 
 * This module provides a comprehensive set of services for implementing
 * Attribute-Based Access Control (ABAC) in client applications.
 * 
 * Architecture:
 * - commonServices.ts: Core HTTP client with OWASP security features
 * - user.service.ts: User authentication and profile management
 * - abac-api.service.ts: ABAC entity management (policies, rules, attributes)
 * - client-policy-evaluator.service.ts: Client-side policy evaluation
 */

// ============================================================================
// Core Services
// ============================================================================

export {
  HttpClient,
  CommonService,
  BatchService,
  ApiResponse,
  RequestConfig,
  HttpClientConfig,
  TokenStorage,
  HttpMethod,
  PaginationParams,
  SearchParams,
  HTTP_STATUS,
  HttpStatus,
  ApiError,
  NetworkError,
  TimeoutError,
  createHttpClient,
  createCommonService,
  createBatchService,
} from './commonServices';

// ============================================================================
// User Service
// ============================================================================

export {
  UserService,
  User,
  LoginCredentials,
  RegisterData,
  ChangePasswordData,
  ResetPasswordData,
  AuthResponse,
  createUserService,
} from './user.service';

// ============================================================================
// Employee Services
// ============================================================================

export {
  EmployeeService, createEmployeeService,
  AddressesService, createAddressesService,
  DepartmentsService, createDepartmentsService,
  EmailAddressesService, createEmailAddressesService,
  EmployeeAddressService, createEmployeeAddressService,
  EmployeesAuditLogService, createEmployeesAuditLogService,
  EmployeesEmergencyContactsService, createEmployeesEmergencyContactsService,
  EmployeesEmergencyContactEmailsService, createEmployeesEmergencyContactEmailsService,
  EmployeesEmergencyContactPhoneNumbersService, createEmployeesEmergencyContactPhoneNumbersService,
  EmployeesPreferencesService, createEmployeesPreferencesService,
  EmployeesRolesService, createEmployeesRolesService,
  EmployeesSettingsService, createEmployeesSettingsService,
  EmployeesSsnService, createEmployeesSsnService,
  EmployeesStatusHistoryService, createEmployeesStatusHistoryService,
  OrganizationService, createOrganizationService,
  PermissionsService, createPermissionsService,
  PhoneNumbersService, createPhoneNumbersService,
  ProjectsService, createProjectsService,
  RolePermissionsService, createRolePermissionsService,
  EmployeeUserService, createEmployeeUserService,
} from './employee.service';

export type {
  Employee, EmployeesRequest,
  Address, AddressesRequest,
  Department, DepartmentsRequest,
  EmailAddress, EmailAddressesRequest,
  EmployeeAddress, EmployeeAddressRequest,
  EmployeesAuditLog, EmployeesAuditLogRequest,
  EmployeesEmergencyContact, EmployeesEmergencyContactsRequest,
  EmployeesEmergencyContactEmail, EmployeesEmergencyContactEmailsRequest,
  EmployeesEmergencyContactPhoneNumber, EmployeesEmergencyContactPhoneNumbersRequest,
  EmployeesPreference, EmployeesPreferencesRequest,
  EmployeesRole, EmployeesRolesRequest,
  EmployeesSetting, EmployeesSettingsRequest,
  EmployeesSsn, EmployeesSsnRequest,
  EmployeesStatusHistory, EmployeesStatusHistoryRequest,
  Organization, OrganizationRequest,
  Permission, PermissionsRequest,
  PhoneNumber, PhoneNumbersRequest,
  Project, ProjectsRequest,
  RolePermission, RolePermissionsRequest,
  EmployeeUser, EmployeeUserRequest,
} from '../types/employee.types';

// ============================================================================
// ABAC API Service
// ============================================================================

export {
  AbacApiService,
  UUID,
  RuleOperator,
  LogicalOperator,
  AbacUser,
  CreateUserRequest,
  UpdateUserRequest,
  Resource,
  CreateResourceRequest,
  UpdateResourceRequest,
  Operation,
  CreateOperationRequest,
  UpdateOperationRequest,
  AttributeDefinition,
  CreateAttributeDefinitionRequest,
  UpdateAttributeDefinitionRequest,
  SubjectAttribute,
  CreateSubjectAttributeRequest,
  UpdateSubjectAttributeRequest,
  UserSubjectAttribute,
  AssignAttributeToUserRequest,
  GroupSubjectAttribute,
  AssignAttributeToGroupRequest,
  UserGroup,
  CreateUserGroupRequest,
  UpdateUserGroupRequest,
  UserGroupMembership,
  AddUserToGroupRequest,
  ResourceAttribute,
  CreateResourceAttributeRequest,
  UpdateResourceAttributeRequest,
  Policy,
  CreatePolicyRequest,
  UpdatePolicyRequest,
  PolicyRule,
  CreatePolicyRuleRequest,
  UpdatePolicyRuleRequest,
  PolicyObligation,
  CreatePolicyObligationRequest,
  UpdatePolicyObligationRequest,
  AccessDecisionRequest,
  AccessDecision,
  AccessDecisionResponse,
  createAbacApiService,
} from './abac-api.service';

// ============================================================================
// Client Policy Evaluator
// ============================================================================

export {
  ClientPolicyEvaluator,
  AttributeMap,
  EvaluationContext,
  ClientEvaluationResult,
  PolicyEvaluationOptions,
  PolicyCache,
  createClientPolicyEvaluator,
} from './client-policy-evaluator.service';

// ============================================================================
// Default Configuration
// ============================================================================

import { createHttpClient, HttpClient } from './commonServices';
import { createUserService, UserService } from './user.service';
import { createAbacApiService, AbacApiService } from './abac-api.service';
import { createClientPolicyEvaluator, ClientPolicyEvaluator } from './client-policy-evaluator.service';
import { createEmployeeService, EmployeeService } from './employee.service';

/**
 * Initialize all services with a common HTTP client
 */
export interface ServiceContainer {
  httpClient: HttpClient;
  userService: UserService;
  abacApiService: AbacApiService;
  policyEvaluator: ClientPolicyEvaluator;
  employeeService: EmployeeService;
}

/**
 * Create a complete service container with all services initialized
 */
export const createServiceContainer = (baseURL: string): ServiceContainer => {
  const httpClient = createHttpClient({
    baseURL,
    timeout: 30000,
    csrfEnabled: true,
  });

  const userService = createUserService(httpClient);
  const abacApiService = createAbacApiService(httpClient);
  const policyEvaluator = createClientPolicyEvaluator(abacApiService, {
    cacheTTL: 5 * 60 * 1000, // 5 minutes
    useCache: true,
    fallbackToServer: true,
  });
  const employeeService = createEmployeeService(httpClient);

  return {
    httpClient,
    userService,
    abacApiService,
    policyEvaluator,
    employeeService,
  };
};
