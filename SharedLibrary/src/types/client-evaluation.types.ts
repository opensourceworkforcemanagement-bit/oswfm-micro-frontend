/**
 * Client-Side Policy Evaluation Types
 */

import {
  UUID,
  Policy,
  PolicyRule,
  SubjectAttribute,
  ResourceAttribute,
  RuleOperator,
  AccessDecision,
} from '../types';

// ============================================================================
// Client-Side Policy Cache
// ============================================================================

export interface PolicyCache {
  policies: Policy[];
  rules: Map<UUID, PolicyRule[]>;
  actionTargets: Map<UUID, UUID[]>; // policyId -> actionIds[]
  resourceTargets: Map<UUID, UUID[]>; // policyId -> resourceIds[]
  resourceTypeTargets: Map<UUID, string[]>; // policyId -> resourceTypes[]
  lastUpdated: Date;
}

// ============================================================================
// Attribute Maps
// ============================================================================

export interface AttributeMap {
  [attributeName: string]: string;
}

// ============================================================================
// Evaluation Context
// ============================================================================

export interface EvaluationContext {
  userId: UUID;
  resourceId: UUID;
  actionId: UUID;
  subjectAttributes: AttributeMap;
  resourceAttributes: AttributeMap;
  environmentAttributes?: AttributeMap;
}

// ============================================================================
// Evaluation Result
// ============================================================================

export interface ClientEvaluationResult {
  decision: AccessDecision;
  reason: string;
  appliedPolicyId?: UUID;
  appliedPolicyName?: string;
  evaluatedPolicies: number;
  evaluationTimeMs: number;
  evaluationDetails: string[];
}

// ============================================================================
// Policy Evaluation Options
// ============================================================================

export interface PolicyEvaluationOptions {
  /**
   * Whether to use cached policies or fetch fresh data
   */
  useCache?: boolean;
  
  /**
   * Cache TTL in milliseconds (default: 5 minutes)
   */
  cacheTTL?: number;
  
  /**
   * Whether to fall back to server evaluation on error
   */
  fallbackToServer?: boolean;
  
  /**
   * Whether to log evaluation details for debugging
   */
  debug?: boolean;
}

// ============================================================================
// Rule Evaluation Functions
// ============================================================================

export type RuleEvaluator = (actualValue: string, comparisonValue: string) => boolean;

export interface RuleEvaluatorMap {
  [operator: string]: RuleEvaluator;
}
