/**
 * Client-Side Policy Evaluation Service
 * Evaluates ABAC policies on the frontend for immediate UI decisions
 * Copied from administrationmanagement (most up-to-date version)
 */

import { AbacApiService, UUID, Policy, PolicyRule } from './abac-api.service';

// ============================================================================
// Types
// ============================================================================

export type AccessDecision = 'PERMIT' | 'DENY';

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

export interface AttributeMap {
  [attributeName: string]: string;
}

export interface EvaluationContext {
  userId: UUID;
  resourceId: UUID;
  actionId: UUID;
  subjectAttributes: AttributeMap;
  resourceAttributes: AttributeMap;
  environmentAttributes?: AttributeMap;
}

export interface ClientEvaluationResult {
  decision: AccessDecision;
  reason: string;
  appliedPolicyId?: UUID;
  appliedPolicyName?: string;
  evaluatedPolicies: number;
  evaluationTimeMs: number;
  evaluationDetails?: string[];
}

export interface PolicyEvaluationOptions {
  cacheTTL?: number;
  useCache?: boolean;
  fallbackToServer?: boolean;
  debug?: boolean;
}

export interface PolicyCache {
  policies: Policy[];
  rules: Map<UUID, PolicyRule[]>;
  actionTargets: Map<UUID, UUID[]>;
  resourceTargets: Map<UUID, UUID[]>;
  resourceTypeTargets: Map<UUID, number[]>;
  lastUpdated: Date;
}

interface RuleEvaluatorMap {
  [operator: string]: (actual: string, comparison: string) => boolean;
}

// ============================================================================
// Client Policy Evaluator
// ============================================================================

export class ClientPolicyEvaluator {
  private cache: PolicyCache | null = null;
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes default
  private refreshPromise: Promise<void> | null = null;

  constructor(
    private apiService: AbacApiService,
    private options: PolicyEvaluationOptions = {}
  ) {
    if (options.cacheTTL) {
      this.cacheTTL = options.cacheTTL;
    }
  }

  // =========================================================================
  // Main Evaluation Method
  // =========================================================================

  async evaluate(
    userId: UUID,
    resourceId: UUID,
    actionId: UUID,
    environmentAttributes?: AttributeMap
  ): Promise<ClientEvaluationResult> {
    const startTime = performance.now();
    const evaluationDetails: string[] = [];

    try {
      const context = await this.buildEvaluationContext(
        userId,
        resourceId,
        actionId,
        environmentAttributes
      );

      evaluationDetails.push(`Evaluating access for user ${userId}`);
      evaluationDetails.push(`Resource: ${resourceId}, Action: ${actionId}`);

      const policies = await this.getPolicies();
      evaluationDetails.push(`Found ${policies.length} active policies`);

      for (const policy of policies) {
        const result = await this.evaluatePolicy(policy, context, evaluationDetails);

        if (result.applicable) {
          if (result.match) {
            const decision = policy.policyTypeName === 'permit' ? 'PERMIT' : 'DENY';
            const endTime = performance.now();

            return {
              decision: decision as AccessDecision,
              reason: result.reason,
              appliedPolicyId: policy.policyId,
              appliedPolicyName: policy.policyName,
              evaluatedPolicies: policies.indexOf(policy) + 1,
              evaluationTimeMs: endTime - startTime,
              evaluationDetails,
            };
          } else {
            evaluationDetails.push(
              `Policy '${policy.policyName}' applicable but conditions not met: ${result.reason}`
            );
          }
        }
      }

      const endTime = performance.now();
      return {
        decision: 'DENY',
        reason: 'No policy explicitly permits this access',
        evaluatedPolicies: policies.length,
        evaluationTimeMs: endTime - startTime,
        evaluationDetails,
      };
    } catch (error) {
      if (this.options.fallbackToServer) {
        console.warn('Client evaluation failed, falling back to server', error);
        return this.fallbackToServerEvaluation(userId, resourceId, actionId, environmentAttributes);
      }

      throw error;
    }
  }

  // =========================================================================
  // Policy Evaluation
  // =========================================================================

  private async evaluatePolicy(
    policy: Policy,
    context: EvaluationContext,
    evaluationDetails: string[]
  ): Promise<{ applicable: boolean; match: boolean; reason: string }> {
    const actionTargets = this.cache?.actionTargets.get(policy.policyId) || [];
    if (actionTargets.length > 0 && !actionTargets.includes(context.actionId)) {
      return { applicable: false, match: false, reason: 'Action not targeted by policy' };
    }

    const resourceTargets = this.cache?.resourceTargets.get(policy.policyId) || [];
    const resourceTypeTargets = this.cache?.resourceTypeTargets.get(policy.policyId) || [];

    if (resourceTargets.length > 0 || resourceTypeTargets.length > 0) {
      const resourceMatches = resourceTargets.includes(context.resourceId);

      if (!resourceMatches && resourceTargets.length > 0) {
        return { applicable: false, match: false, reason: 'Resource not targeted by policy' };
      }
    }

    const rules = this.cache?.rules.get(policy.policyId) || [];

    if (rules.length === 0) {
      evaluationDetails.push(`Policy '${policy.policyName}' has no rules - applies to all`);
      return { applicable: true, match: true, reason: 'Policy has no conditions - applies to all' };
    }

    const ruleResult = this.evaluateRules(
      rules,
      context.subjectAttributes,
      context.resourceAttributes,
      context.environmentAttributes || {}
    );

    if (ruleResult.match) {
      evaluationDetails.push(`Policy '${policy.policyName}' matched: ${ruleResult.reason}`);
    }

    return { applicable: true, ...ruleResult };
  }

  private evaluateRules(
    rules: PolicyRule[],
    subjectAttributes: AttributeMap,
    resourceAttributes: AttributeMap,
    environmentAttributes: AttributeMap
  ): { match: boolean; reason: string } {
    let overallResult = true;
    let currentLogicalOp = 'AND';
    const failedConditions: string[] = [];

    for (const rule of rules) {
      const actualValue = this.getAttributeValue(
        rule.attributeName || '',
        subjectAttributes,
        resourceAttributes,
        environmentAttributes
      );

      if (actualValue === undefined || actualValue === null) {
        if (currentLogicalOp === 'AND') {
          return {
            match: false,
            reason: `Required attribute '${rule.attributeName}' not found`,
          };
        }
        continue;
      }

      const ruleResult = this.evaluateRule(rule.operator, actualValue, rule.comparisonValue);

      if (!ruleResult) {
        failedConditions.push(
          `${rule.attributeName} ${rule.operator} ${rule.comparisonValue} (actual: ${actualValue})`
        );
      }

      if (currentLogicalOp === 'OR') {
        overallResult = overallResult || ruleResult;
      } else {
        overallResult = overallResult && ruleResult;
      }

      currentLogicalOp = rule.logicalOperator;
    }

    if (overallResult) {
      return { match: true, reason: 'All conditions satisfied' };
    } else {
      return {
        match: false,
        reason: `Conditions failed: ${failedConditions.join('; ')}`,
      };
    }
  }

  private evaluateRule(operator: RuleOperator, actualValue: string, comparisonValue: string): boolean {
    const evaluators: RuleEvaluatorMap = {
      equals: (actual, comparison) =>
        actual.toLowerCase() === comparison.toLowerCase(),
      not_equals: (actual, comparison) =>
        actual.toLowerCase() !== comparison.toLowerCase(),
      contains: (actual, comparison) =>
        actual.toLowerCase().includes(comparison.toLowerCase()),
      not_contains: (actual, comparison) =>
        !actual.toLowerCase().includes(comparison.toLowerCase()),
      in: (actual, comparison) => {
        const values = comparison.split(',').map((v) => v.trim().toLowerCase());
        return values.includes(actual.toLowerCase());
      },
      not_in: (actual, comparison) => {
        const values = comparison.split(',').map((v) => v.trim().toLowerCase());
        return !values.includes(actual.toLowerCase());
      },
      greater_than: (actual, comparison) => {
        const a = parseFloat(actual), c = parseFloat(comparison);
        return !isNaN(a) && !isNaN(c) && a > c;
      },
      less_than: (actual, comparison) => {
        const a = parseFloat(actual), c = parseFloat(comparison);
        return !isNaN(a) && !isNaN(c) && a < c;
      },
      greater_than_or_equal: (actual, comparison) => {
        const a = parseFloat(actual), c = parseFloat(comparison);
        return !isNaN(a) && !isNaN(c) && a >= c;
      },
      less_than_or_equal: (actual, comparison) => {
        const a = parseFloat(actual), c = parseFloat(comparison);
        return !isNaN(a) && !isNaN(c) && a <= c;
      },
      starts_with: (actual, comparison) =>
        actual.toLowerCase().startsWith(comparison.toLowerCase()),
      ends_with: (actual, comparison) =>
        actual.toLowerCase().endsWith(comparison.toLowerCase()),
    };

    const evaluator = evaluators[operator];
    if (!evaluator) {
      console.warn(`Unknown operator: ${operator}`);
      return false;
    }

    return evaluator(actualValue, comparisonValue);
  }

  private getAttributeValue(
    attributeName: string,
    subjectAttributes: AttributeMap,
    resourceAttributes: AttributeMap,
    environmentAttributes: AttributeMap
  ): string | undefined {
    if (subjectAttributes[attributeName] !== undefined) return subjectAttributes[attributeName];
    if (resourceAttributes[attributeName] !== undefined) return resourceAttributes[attributeName];
    if (environmentAttributes[attributeName] !== undefined) return environmentAttributes[attributeName];
    return undefined;
  }

  // =========================================================================
  // Context Building
  // =========================================================================

  private async buildEvaluationContext(
    userId: UUID,
    resourceId: UUID,
    actionId: UUID,
    environmentAttributes?: AttributeMap
  ): Promise<EvaluationContext> {
    const subjectAttrs = await this.apiService.getActiveSubjectAttributesByUserId(userId);
    const subjectAttributes: AttributeMap = {};
    subjectAttrs.forEach((attr) => {
      if (attr.attributeName) {
        subjectAttributes[attr.attributeName] = attr.attributeValue;
      }
    });

    const resourceAttrs = await this.apiService.getActiveResourceAttributesByResourceId(resourceId);
    const resourceAttributes: AttributeMap = {};
    resourceAttrs.forEach((attr) => {
      if (attr.attributeName) {
        resourceAttributes[attr.attributeName] = attr.attributeValue;
      }
    });

    return {
      userId,
      resourceId,
      actionId,
      subjectAttributes,
      resourceAttributes,
      environmentAttributes,
    };
  }

  // =========================================================================
  // Cache Management
  // =========================================================================

  private async getPolicies(): Promise<Policy[]> {
    const useCache = this.options.useCache !== false;

    if (useCache && this.cache && !this.isCacheExpired()) {
      return this.cache.policies;
    }

    await this.refreshCache();
    return this.cache?.policies || [];
  }

  private isCacheExpired(): boolean {
    if (!this.cache) return true;
    const elapsed = new Date().getTime() - this.cache.lastUpdated.getTime();
    return elapsed > this.cacheTTL;
  }

  async refreshCache(): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performCacheRefresh();

    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performCacheRefresh(): Promise<void> {
    try {
      const policies = await this.apiService.getActivePolicies();
      policies.sort((a, b) => b.priority - a.priority);

      const rulesMap = new Map<UUID, PolicyRule[]>();
      const actionTargetsMap = new Map<UUID, UUID[]>();
      const resourceTargetsMap = new Map<UUID, UUID[]>();
      const resourceTypeTargetsMap = new Map<UUID, number[]>();

      const rulePromises = policies.map(async (policy) => {
        const rules = await this.apiService.getRulesByPolicyId(policy.policyId);
        rules.sort((a, b) => a.ruleOrder - b.ruleOrder);
        rulesMap.set(policy.policyId, rules);
      });

      await Promise.all(rulePromises);

      this.cache = {
        policies,
        rules: rulesMap,
        actionTargets: actionTargetsMap,
        resourceTargets: resourceTargetsMap,
        resourceTypeTargets: resourceTypeTargetsMap,
        lastUpdated: new Date(),
      };

      if (this.options.debug) {
        console.log('Policy cache refreshed', {
          policies: policies.length,
          totalRules: Array.from(rulesMap.values()).reduce((sum, rules) => sum + rules.length, 0),
        });
      }
    } catch (error) {
      console.error('Failed to refresh policy cache', error);
      throw error;
    }
  }

  setPolicyTargets(
    policyId: UUID,
    actionIds: UUID[],
    resourceIds: UUID[],
    resourceTypeIds: number[]
  ): void {
    if (!this.cache) {
      throw new Error('Cache not initialized');
    }
    this.cache.actionTargets.set(policyId, actionIds);
    this.cache.resourceTargets.set(policyId, resourceIds);
    this.cache.resourceTypeTargets.set(policyId, resourceTypeIds);
  }

  clearCache(): void {
    this.cache = null;
  }

  getCacheStats(): { cached: boolean; policies: number; rules: number; age: number } | null {
    if (!this.cache) return null;
    const age = new Date().getTime() - this.cache.lastUpdated.getTime();
    const totalRules = Array.from(this.cache.rules.values()).reduce(
      (sum, rules) => sum + rules.length, 0
    );
    return { cached: true, policies: this.cache.policies.length, rules: totalRules, age };
  }

  // =========================================================================
  // Server Fallback
  // =========================================================================

  private async fallbackToServerEvaluation(
    userId: UUID,
    resourceId: UUID,
    actionId: UUID,
    environmentAttributes?: AttributeMap
  ): Promise<ClientEvaluationResult> {
    const startTime = performance.now();

    const response = await this.apiService.evaluateAccess({
      userId,
      resourceId,
      actionId,
      environmentAttributes,
    });

    const endTime = performance.now();

    return {
      decision: response.decision,
      reason: response.reason,
      appliedPolicyId: response.appliedPolicyId,
      appliedPolicyName: response.appliedPolicyName,
      evaluatedPolicies: 0,
      evaluationTimeMs: endTime - startTime,
      evaluationDetails: response.evaluationDetails,
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export const createClientPolicyEvaluator = (
  apiService: AbacApiService,
  options?: PolicyEvaluationOptions
): ClientPolicyEvaluator => {
  return new ClientPolicyEvaluator(apiService, options);
};
