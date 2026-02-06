/**
 * Client-Side Policy Evaluation Types
 * Re-exports types from services for consistency
 */

import { UUID, Policy, PolicyRule, AccessDecision } from '../types';

// Re-export from client-policy-evaluator.service for consistency
export type {
  AttributeMap,
  EvaluationContext,
  ClientEvaluationResult,
  PolicyEvaluationOptions,
  PolicyCache,
} from '../services/client-policy-evaluator.service';

// Re-export base types for convenience
export type { UUID, Policy, PolicyRule, AccessDecision };

// ============================================================================
// Rule Evaluation Functions
// ============================================================================

export type RuleEvaluator = (actualValue: string, comparisonValue: string) => boolean;

export interface RuleEvaluatorMap {
  [operator: string]: RuleEvaluator;
}
