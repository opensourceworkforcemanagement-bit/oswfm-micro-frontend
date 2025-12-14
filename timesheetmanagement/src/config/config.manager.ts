// ============================================================================
// src/config/config.manager.ts
// Base Configuration Manager - Abstract class for all config managers
// ============================================================================

export abstract class BaseConfigManager<T> {
  /**
   * Get API base URL from environment variables
   * Supports Vite, Create React App, and runtime configuration
   */
  static getApiBaseUrl(): string {
    // Check Vite environment variables
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:1110/api/v1';
    }
    
    // Check Create React App environment variables
    if (typeof process !== 'undefined' && process.env) {
      return process.env.REACT_APP_API_BASE_URL || 'http://localhost:1110/api/v1';
    }
    
    // Check window global (for runtime config)
    if (typeof window !== 'undefined' && (window as any).API_BASE_URL) {
      return (window as any).API_BASE_URL;
    }
    
    // Fallback
    return 'http://localhost:1110/api/v1';
  }

  /**
   * Abstract method - must be implemented by child classes
   * Returns the default configuration for the module
   */
  abstract getDefaultPageConfig(): T;

  /**
   * Get configuration from API (if stored in database)
   * This method fetches dynamic configuration from the backend
   * 
   * @param moduleCode - Unique identifier for the module (e.g., 'work_code_management')
   * @returns Promise with configuration or null if not found
   */
  async getConfigFromApi(moduleCode: string): Promise<T | null> {
    try {
      const response = await fetch(`${BaseConfigManager.getApiBaseUrl()}/config/modules/${moduleCode}`);
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      
      console.warn(`Failed to fetch config for ${moduleCode}, using default config`);
      return null;
    } catch (error) {
      console.error(`Error fetching config for ${moduleCode}:`, error);
      return null;
    }
  }

  /**
   * Save configuration to API (if persisting to database)
   * This method persists configuration changes to the backend
   * 
   * @param moduleCode - Unique identifier for the module
   * @param config - Configuration object to save
   * @returns Promise with boolean indicating success
   */
  async saveConfigToApi(moduleCode: string, config: T): Promise<boolean> {
    try {
      const response = await fetch(`${BaseConfigManager.getApiBaseUrl()}/config/modules/${moduleCode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });
      
      return response.ok;
    } catch (error) {
      console.error(`Error saving config for ${moduleCode}:`, error);
      return false;
    }
  }

  /**
   * Merge configurations
   * Useful for combining default config with partial API config
   * 
   * @param defaultConfig - Default configuration
   * @param apiConfig - Configuration from API (partial or complete)
   * @returns Merged configuration
   */
  protected mergeConfigs(defaultConfig: T, apiConfig: Partial<T> | null): T {
    if (!apiConfig) {
      return defaultConfig;
    }

    return {
      ...defaultConfig,
      ...apiConfig
    };
  }

  /**
   * Validate configuration
   * Override in child classes for custom validation
   * 
   * @param config - Configuration to validate
   * @returns true if valid, false otherwise
   */
  protected validateConfig(config: T): boolean {
    return config !== null && config !== undefined;
  }
}

/**
 * Example usage in derived classes:
 * 
 * class MyConfigManager extends BaseConfigManager<MyConfig> {
 *   getDefaultPageConfig(): MyConfig {
 *     return { ... };
 *   }
 * }
 */
