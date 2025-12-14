/**
 * ABAC Context Provider
 * Provides ABAC services throughout the React application
 */

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { ApiClient } from '../utils/api-client';
import { AbacApiService } from '../services/abac-api.service';
import { ClientPolicyEvaluator } from '../services/client-policy-evaluator.service';
import { PolicyEvaluationOptions } from '../types/client-evaluation.types';

// ============================================================================
// Context Types
// ============================================================================

export interface AbacContextValue {
  apiService: AbacApiService;
  evaluator: ClientPolicyEvaluator;
  refreshPolicies: () => Promise<void>;
  clearCache: () => void;
}

export interface AbacProviderProps {
  children: ReactNode;
  apiBaseUrl: string;
  apiTimeout?: number;
  authToken?: string;
  evaluationOptions?: PolicyEvaluationOptions;
}

// ============================================================================
// Context
// ============================================================================

const AbacContext = createContext<AbacContextValue | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

export function AbacProvider({
  children,
  apiBaseUrl,
  apiTimeout,
  authToken,
  evaluationOptions,
}: AbacProviderProps) {
  const contextValue = useMemo(() => {
    // Create API client
    const apiClient = new ApiClient({
      baseURL: apiBaseUrl,
      timeout: apiTimeout,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    });

    // Create API service
    const apiService = new AbacApiService(apiClient);

    // Create evaluator
    const evaluator = new ClientPolicyEvaluator(apiService, evaluationOptions);

    return {
      apiService,
      evaluator,
      refreshPolicies: () => evaluator.refreshCache(),
      clearCache: () => evaluator.clearCache(),
    };
  }, [apiBaseUrl, apiTimeout, authToken, evaluationOptions]);

  return <AbacContext.Provider value={contextValue}>{children}</AbacContext.Provider>;
}

// ============================================================================
// Hook to use ABAC Context
// ============================================================================

export function useAbac(): AbacContextValue {
  const context = useContext(AbacContext);
  
  if (!context) {
    throw new Error('useAbac must be used within an AbacProvider');
  }
  
  return context;
}

// ============================================================================
// Hook to use API Service
// ============================================================================

export function useAbacApi(): AbacApiService {
  const { apiService } = useAbac();
  return apiService;
}

// ============================================================================
// Hook to use Evaluator
// ============================================================================

export function useAbacEvaluator(): ClientPolicyEvaluator {
  const { evaluator } = useAbac();
  return evaluator;
}
