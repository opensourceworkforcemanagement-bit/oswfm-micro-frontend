/**
 * ABAC Services - Main Export File
 *
 * This module provides a comprehensive set of services for implementing
 * Attribute-Based Access Control (ABAC) in client applications.
 *
 * Architecture:
 * - common.services.ts: Core HTTP client with OWASP security features
 * - abac-api.service.ts: ABAC entity management (policies, rules, attributes)
 * - client-policy-evaluator.service.ts: Client-side policy evaluation
 * - lookup.service.ts: Lookup data caching and management
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

export {
  BaseEntity,
  FieldConfig,
  ColumnConfig,
  ActionConfig,
  TabConfig,
  PageConfig,
} from '../types/common.types';

// ============================================================================
// ABAC API Service
// ============================================================================

export { AbacApiService, createAbacApiService } from './abac-api.service';

export type {
  UUID,
  User,
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
  LogicalOperator,
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
import { createAbacApiService, AbacApiService } from './abac-api.service';
import { createClientPolicyEvaluator, ClientPolicyEvaluator } from './client-policy-evaluator.service';
import { createLookupDataService, LookupDataService } from './lookup.service';

/**
 * Initialize all services with a common HTTP client
 */
export interface ServiceContainer {
  httpClient: HttpClient;
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
    abacApiService,
    policyEvaluator,
    lookupService,
  };
};
