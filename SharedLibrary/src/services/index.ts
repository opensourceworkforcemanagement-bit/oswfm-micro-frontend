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
  ApiResponse,
  RequestConfig,
  HttpClientConfig,
  TokenStorage,
  HttpMethod,
  HttpClient,
  HttpStatus,
  CommonService,
  BatchService,
  HTTP_STATUS,
  ApiError,
  NetworkError,
  TimeoutError,
  LookupType,
  AllLookupData,
  createHttpClient,
  createCommonService,
  createBatchService,
} from './common.services';


export{
  BaseEntity,
  FieldConfig,
  ColumnConfig,
  ActionConfig,
  TabConfig,
  PageConfig,
} from '../types/common.types';

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
} from './user.service.ts';

// ============================================================================
// ABAC API Service
// ============================================================================

export {
  AbacApiService,
  UUID,
  CreateUserRequest,
  UpdateUserRequest,
  Resource,
  CreateResourceRequest,
  UpdateResourceRequest,
  Action,
  CreateActionRequest,
  UpdateActionRequest,
  AttributeDefinition,
  CreateAttributeDefinitionRequest,
  UpdateAttributeDefinitionRequest,
  SubjectAttribute,
  CreateSubjectAttributeRequest,
  UpdateSubjectAttributeRequest,
  ResourceAttribute,
  CreateResourceAttributeRequest,
  UpdateResourceAttributeRequest,
  Policy,
  CreatePolicyRequest,
  UpdatePolicyRequest,
  PolicyRule,
  CreatePolicyRuleRequest,
  UpdatePolicyRuleRequest,
  AccessDecisionRequest,
  AccessDecision,
  AccessDecisionResponse,
  RuleOperator,
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
// Lookup Data Service
// ============================================================================

export {
  LookupDataService,
  LookupCacheEntry,
  LookupServiceOptions,
  createLookupDataService,
} from './lookup.service';

// ============================================================================
// Default Configuration
// ============================================================================

import { createHttpClient, HttpClient } from './common.services';
import { createUserService, UserService } from './user.service.ts';
import { createAbacApiService, AbacApiService } from './abac-api.service';
import { createClientPolicyEvaluator, ClientPolicyEvaluator } from './client-policy-evaluator.service';
import { createLookupDataService, LookupDataService } from './lookup.service';

/**
 * Initialize all services with a common HTTP client
 */
export interface ServiceContainer {
  httpClient: HttpClient;
  userService: UserService;
  abacApiService: AbacApiService;
  policyEvaluator: ClientPolicyEvaluator;
  lookupService: LookupDataService;
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
  const lookupService = createLookupDataService(httpClient, {
    cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
    useLocalforage: true,
  });

  return {
    httpClient,
    userService,
    abacApiService,
    policyEvaluator,
    lookupService,
  };
};
