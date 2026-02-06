/**
 * Lookup Data Service
 * Loads and caches ABAC lookup types at app startup
 * Uses in-memory cache with localforage persistence
 */

import localforage from 'localforage';
import {
  HttpClient,
  ApiResponse,
  LookupType,
  AllLookupData,
} from './common.services';

// ============================================================================
// Types
// ============================================================================

export interface LookupCacheEntry {
  data: AllLookupData;
  cachedAt: number;
}

export interface LookupServiceOptions {
  cacheTTL?: number;
  useLocalforage?: boolean;
  debug?: boolean;
}

// ============================================================================
// Lookup Data Service
// ============================================================================

export class LookupDataService {
  private cache: LookupCacheEntry | null = null;
  private refreshPromise: Promise<AllLookupData> | null = null;
  private readonly cacheTTL: number;
  private readonly useLocalforage: boolean;
  private readonly STORAGE_KEY = 'abac_lookup_data';
  private initialized: boolean = false;

  constructor(
    private client: HttpClient,
    private options: LookupServiceOptions = {}
  ) {
    this.cacheTTL = options.cacheTTL || 24 * 60 * 60 * 1000; // 24 hours
    this.useLocalforage = options.useLocalforage !== false;
  }

  // =========================================================================
  // Initialization (call at app startup)
  // =========================================================================

  async initialize(): Promise<AllLookupData> {
    if (this.useLocalforage) {
      const stored = await this.loadFromStorage();
      if (stored && !this.isExpired(stored.cachedAt)) {
        this.cache = stored;
        this.initialized = true;

        if (this.options.debug) {
          console.log('Lookup data loaded from storage', {
            resourceTypes: stored.data.resourceTypes.length,
            attributeCategories: stored.data.attributeCategories.length,
            policyTypes: stored.data.policyTypes.length,
            obligationTypes: stored.data.obligationTypes.length,
            dataTypes: stored.data.dataTypes.length,
          });
        }

        return stored.data;
      }
    }

    const data = await this.fetchAllLookups();
    this.initialized = true;
    return data;
  }

  // =========================================================================
  // Accessor Methods
  // =========================================================================

  getResourceTypes(): LookupType[] {
    return this.cache?.data.resourceTypes || [];
  }

  getAttributeCategories(): LookupType[] {
    return this.cache?.data.attributeCategories || [];
  }

  getPolicyTypes(): LookupType[] {
    return this.cache?.data.policyTypes || [];
  }

  getObligationTypes(): LookupType[] {
    return this.cache?.data.obligationTypes || [];
  }

  getDataTypes(): LookupType[] {
    return this.cache?.data.dataTypes || [];
  }

  getAllLookups(): AllLookupData | null {
    return this.cache?.data || null;
  }

  // =========================================================================
  // Helper Methods (resolve name to lookup entry)
  // =========================================================================

  getResourceTypeByName(name: string): LookupType | undefined {
    return this.getResourceTypes().find(
      (t) => t.name.toLowerCase() === name.toLowerCase()
    );
  }

  getAttributeCategoryByName(name: string): LookupType | undefined {
    return this.getAttributeCategories().find(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );
  }

  getPolicyTypeByName(name: string): LookupType | undefined {
    return this.getPolicyTypes().find(
      (t) => t.name.toLowerCase() === name.toLowerCase()
    );
  }

  getObligationTypeByName(name: string): LookupType | undefined {
    return this.getObligationTypes().find(
      (t) => t.name.toLowerCase() === name.toLowerCase()
    );
  }

  getDataTypeByName(name: string): LookupType | undefined {
    return this.getDataTypes().find(
      (t) => t.name.toLowerCase() === name.toLowerCase()
    );
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // =========================================================================
  // Cache Management
  // =========================================================================

  async refresh(): Promise<AllLookupData> {
    return this.fetchAllLookups();
  }

  clearCache(): void {
    this.cache = null;
    this.initialized = false;
    if (this.useLocalforage) {
      localforage.removeItem(this.STORAGE_KEY);
    }
  }

  getCacheStats(): {
    cached: boolean;
    age: number;
    counts: Record<string, number>;
  } | null {
    if (!this.cache) return null;

    return {
      cached: true,
      age: Date.now() - this.cache.cachedAt,
      counts: {
        resourceTypes: this.cache.data.resourceTypes.length,
        attributeCategories: this.cache.data.attributeCategories.length,
        policyTypes: this.cache.data.policyTypes.length,
        obligationTypes: this.cache.data.obligationTypes.length,
        dataTypes: this.cache.data.dataTypes.length,
      },
    };
  }

  // =========================================================================
  // Private Methods
  // =========================================================================

  private async fetchAllLookups(): Promise<AllLookupData> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performFetch();
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performFetch(): Promise<AllLookupData> {
    const response: ApiResponse<AllLookupData> =
      await this.client.get<AllLookupData>('/lookups');

    if (!response.success || !response.data) {
      throw new Error('Failed to load lookup data');
    }

    const entry: LookupCacheEntry = {
      data: response.data,
      cachedAt: Date.now(),
    };

    this.cache = entry;

    if (this.useLocalforage) {
      await this.saveToStorage(entry);
    }

    if (this.options.debug) {
      console.log('Lookup data fetched from API', {
        resourceTypes: response.data.resourceTypes.length,
        attributeCategories: response.data.attributeCategories.length,
        policyTypes: response.data.policyTypes.length,
        obligationTypes: response.data.obligationTypes.length,
        dataTypes: response.data.dataTypes.length,
      });
    }

    return response.data;
  }

  private isExpired(cachedAt: number): boolean {
    return Date.now() - cachedAt > this.cacheTTL;
  }

  private async loadFromStorage(): Promise<LookupCacheEntry | null> {
    try {
      return await localforage.getItem<LookupCacheEntry>(this.STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private async saveToStorage(entry: LookupCacheEntry): Promise<void> {
    try {
      await localforage.setItem(this.STORAGE_KEY, entry);
    } catch (error) {
      console.error('Failed to persist lookup data', error);
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export const createLookupDataService = (
  client: HttpClient,
  options?: LookupServiceOptions
): LookupDataService => {
  return new LookupDataService(client, options);
};
