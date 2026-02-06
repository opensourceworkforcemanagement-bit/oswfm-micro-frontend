/**
 * ABAC Context Provider
 * Provides ABAC services throughout the React application
 */

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { HttpClient } from '../services/common.services';
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
  evaluationOptions,
}: AbacProviderProps) {
  const contextValue = useMemo(() => {
    // Create HTTP client using HttpClient from common.services
    // Token is automatically retrieved from SecureTokenStorage via buildHeaders
    const httpClient = new HttpClient({
      baseURL: apiBaseUrl,
      timeout: apiTimeout,
    });

    // Create API service
    const apiService = new AbacApiService(httpClient);

    // Create evaluator
    const evaluator = new ClientPolicyEvaluator(apiService, evaluationOptions);

    return {
      apiService,
      evaluator,
      refreshPolicies: () => evaluator.refreshCache(),
      clearCache: () => evaluator.clearCache(),
    };
  }, [apiBaseUrl, apiTimeout, evaluationOptions]);

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
