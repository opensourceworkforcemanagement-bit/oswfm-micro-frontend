/**
 * React Hooks for ABAC Integration
 * Custom hooks for easy policy evaluation in React components
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { UUID, AccessDecision } from '../types';
import { ClientEvaluationResult, AttributeMap } from '../types/client-evaluation.types';
import { ClientPolicyEvaluator } from '../services/client-policy-evaluator.service';

// ============================================================================
// Utility for stable object comparison
// ============================================================================

/**
 * Creates a stable JSON string for object comparison in dependencies
 */
function useStableJson<T>(value: T): string {
  return useMemo(() => JSON.stringify(value), [JSON.stringify(value)]);
}

// ============================================================================
// useAccessControl Hook
// ============================================================================

export interface UseAccessControlOptions {
  /**
   * Current user ID
   */
  userId?: UUID;
  
  /**
   * Resource ID to check access for
   */
  resourceId?: UUID;
  
  /**
   * Action ID to check
   */
  actionId?: UUID;
  
  /**
   * Environment attributes
   */
  environmentAttributes?: AttributeMap;
  
  /**
   * Whether to automatically evaluate on mount/changes
   */
  autoEvaluate?: boolean;
  
  /**
   * Whether to show loading state
   */
  showLoading?: boolean;
}

export interface UseAccessControlResult {
  /**
   * Whether access is permitted
   */
  isPermitted: boolean;
  
  /**
   * Whether access is denied
   */
  isDenied: boolean;
  
  /**
   * Current decision
   */
  decision: AccessDecision | null;
  
  /**
   * Reason for decision
   */
  reason: string | null;
  
  /**
   * Full evaluation result
   */
  result: ClientEvaluationResult | null;
  
  /**
   * Whether evaluation is in progress
   */
  isLoading: boolean;
  
  /**
   * Error if evaluation failed
   */
  error: Error | null;
  
  /**
   * Manually trigger evaluation
   */
  evaluate: () => Promise<void>;
  
  /**
   * Refresh cache and re-evaluate
   */
  refresh: () => Promise<void>;
}

/**
 * Hook for checking access control
 */
export function useAccessControl(
  evaluator: ClientPolicyEvaluator,
  options: UseAccessControlOptions
): UseAccessControlResult {
  const [result, setResult] = useState<ClientEvaluationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Memoize environment attributes to prevent unnecessary re-evaluations
  const environmentKey = useStableJson(options.environmentAttributes);

  const evaluate = useCallback(async () => {
    if (!options.userId || !options.resourceId || !options.actionId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const evaluationResult = await evaluator.evaluate(
        options.userId,
        options.resourceId,
        options.actionId,
        options.environmentAttributes
      );
      setResult(evaluationResult);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Evaluation failed'));
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    evaluator,
    options.userId,
    options.resourceId,
    options.actionId,
    environmentKey,
  ]);

  const refresh = useCallback(async () => {
    await evaluator.refreshCache();
    await evaluate();
  }, [evaluator, evaluate]);

  useEffect(() => {
    if (options.autoEvaluate !== false) {
      evaluate();
    }
  }, [evaluate, options.autoEvaluate]);

  return {
    isPermitted: result?.decision === 'PERMIT',
    isDenied: result?.decision === 'DENY',
    decision: result?.decision || null,
    reason: result?.reason || null,
    result,
    isLoading: options.showLoading !== false ? isLoading : false,
    error,
    evaluate,
    refresh,
  };
}

// ============================================================================
// usePermission Hook
// ============================================================================

export interface UsePermissionOptions {
  userId: UUID;
  resourceId: UUID;
  actionId: UUID;
  environmentAttributes?: AttributeMap;
}

/**
 * Simplified hook that returns just a boolean permission
 */
export function usePermission(
  evaluator: ClientPolicyEvaluator,
  options: UsePermissionOptions
): boolean {
  const { isPermitted } = useAccessControl(evaluator, {
    ...options,
    autoEvaluate: true,
    showLoading: false,
  });

  return isPermitted;
}

// ============================================================================
// useConditionalRender Hook
// ============================================================================

export interface ConditionalRenderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

/**
 * Hook that returns a component that conditionally renders based on permissions
 */
export function useConditionalRender(
  evaluator: ClientPolicyEvaluator,
  options: UsePermissionOptions
) {
  return function ConditionalRender({ children, fallback, loading }: ConditionalRenderProps) {
    const { isPermitted, isLoading } = useAccessControl(evaluator, {
      ...options,
      autoEvaluate: true,
    });

    if (isLoading && loading) {
      return <>{loading}</>;
    }

    if (isPermitted) {
      return <>{children}</>;
    }

    return fallback ? <>{fallback}</> : null;
  };
}

// ============================================================================
// useMultiplePermissions Hook
// ============================================================================

export interface MultiplePermissionsOptions {
  userId: UUID;
  permissions: Array<{
    resourceId: UUID;
    actionId: UUID;
    key: string;
  }>;
  environmentAttributes?: AttributeMap;
}

export interface MultiplePermissionsResult {
  permissions: Record<string, boolean>;
  isLoading: boolean;
  hasAny: boolean;
  hasAll: boolean;
  evaluate: () => Promise<void>;
}

/**
 * Hook for checking multiple permissions at once (parallel evaluation)
 */
export function useMultiplePermissions(
  evaluator: ClientPolicyEvaluator,
  options: MultiplePermissionsOptions
): MultiplePermissionsResult {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Memoize permissions array to prevent unnecessary re-evaluations
  const permissionsKey = useStableJson(options.permissions);
  const environmentKey = useStableJson(options.environmentAttributes);

  const evaluate = useCallback(async () => {
    if (options.permissions.length === 0) {
      setPermissions({});
      return;
    }

    setIsLoading(true);

    try {
      // Evaluate all permissions in parallel using Promise.all
      const evaluationPromises = options.permissions.map(async (perm) => {
        try {
          const result = await evaluator.evaluate(
            options.userId,
            perm.resourceId,
            perm.actionId,
            options.environmentAttributes
          );
          return { key: perm.key, permitted: result.decision === 'PERMIT' };
        } catch (error) {
          console.error(`Failed to evaluate permission ${perm.key}`, error);
          return { key: perm.key, permitted: false };
        }
      });

      const evaluationResults = await Promise.all(evaluationPromises);

      // Convert array of results to record
      const results: Record<string, boolean> = {};
      for (const { key, permitted } of evaluationResults) {
        results[key] = permitted;
      }

      setPermissions(results);
    } finally {
      setIsLoading(false);
    }
  }, [evaluator, options.userId, permissionsKey, environmentKey]);

  useEffect(() => {
    evaluate();
  }, [evaluate]);

  const hasAny = useMemo(() => {
    return Object.values(permissions).some((p) => p);
  }, [permissions]);

  const hasAll = useMemo(() => {
    return Object.values(permissions).every((p) => p);
  }, [permissions]);

  return {
    permissions,
    isLoading,
    hasAny,
    hasAll,
    evaluate,
  };
}

// ============================================================================
// useResourcePermissions Hook
// ============================================================================

export interface ResourcePermissionsOptions {
  userId: UUID;
  resourceId: UUID;
  actions: Array<{ id: UUID; name: string }>;
  environmentAttributes?: AttributeMap;
}

export interface ResourcePermissionsResult {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canExecute: boolean;
  permissions: Record<string, boolean>;
  isLoading: boolean;
  evaluate: () => Promise<void>;
}

/**
 * Hook for checking common resource permissions
 */
export function useResourcePermissions(
  evaluator: ClientPolicyEvaluator,
  options: ResourcePermissionsOptions
): ResourcePermissionsResult {
  // Memoize the actions to permissions mapping to prevent unnecessary re-renders
  const actionsKey = useStableJson(options.actions);
  const environmentKey = useStableJson(options.environmentAttributes);

  const permissionOptions: MultiplePermissionsOptions = useMemo(() => ({
    userId: options.userId,
    permissions: options.actions.map((action) => ({
      resourceId: options.resourceId,
      actionId: action.id,
      key: action.name,
    })),
    environmentAttributes: options.environmentAttributes,
  }), [options.userId, options.resourceId, actionsKey, environmentKey]);

  const { permissions, isLoading, evaluate } = useMultiplePermissions(
    evaluator,
    permissionOptions
  );

  return {
    canRead: permissions['read'] || false,
    canWrite: permissions['write'] || false,
    canDelete: permissions['delete'] || false,
    canExecute: permissions['execute'] || false,
    permissions,
    isLoading,
    evaluate,
  };
}
