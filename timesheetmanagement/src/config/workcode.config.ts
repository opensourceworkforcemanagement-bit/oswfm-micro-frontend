// ============================================================================
// src/config/workcode.config.ts
// Work Code Management Configuration Manager
// ============================================================================

import { BaseConfigManager } from './config.manager';
import { WorkCodePageConfig } from '../types/workcode.types';

/**
 * Configuration Manager for Work Code Management Module
 * Implements singleton pattern to ensure single instance across application
 * Provides methods to access and manage work code configurations
 */
export class WorkCodeConfigManager extends BaseConfigManager<WorkCodePageConfig> {
  private static instance: WorkCodeConfigManager;
  private config: WorkCodePageConfig | null = null;
  private readonly MODULE_CODE = 'work_code_management';

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    super();
  }

  /**
   * Get singleton instance of WorkCodeConfigManager
   * Ensures only one instance exists throughout the application
   * 
   * @returns Single instance of WorkCodeConfigManager
   */
  static getInstance(): WorkCodeConfigManager {
    if (!WorkCodeConfigManager.instance) {
      WorkCodeConfigManager.instance = new WorkCodeConfigManager();
    }
    return WorkCodeConfigManager.instance;
  }

  /**
   * Get default page configuration for Work Code Management
   * This configuration includes columns, fields, and actions
   * 
   * @returns Default WorkCodePageConfig object
   */
  static getDefaultPageConfig(): WorkCodePageConfig {
    return {
      columns: {
        work_code_id: { 
          visible: false, 
          label: 'ID' 
        },
        prefix: { 
          visible: true, 
          label: 'Prefix' 
        },
        suffix: { 
          visible: true, 
          label: 'Suffix' 
        },
        short_work_code: { 
          visible: true, 
          label: 'Short Code' 
        },
        long_work_code: { 
          visible: true, 
          label: 'Long Code' 
        },
        description: { 
          visible: true, 
          label: 'Description' 
        },
        status: { 
          visible: true, 
          label: 'Status' 
        }
      },
      fields: {
        prefix: { 
          tab: ['general'],
          enabled: true, 
          readonly: false, 
          visible: true,
          label: 'Prefix',
          hint: 'Maximum 10 characters',
          required: false
        },
        suffix: { 
          tab: ['general'],
          enabled: true, 
          readonly: false, 
          visible: true,
          label: 'Suffix',
          hint: 'Maximum 10 characters',
          required: false
        },
        short_work_code: { 
          tab: ['general'],
          enabled: true, 
          readonly: false, 
          visible: true,
          label: 'Short Work Code',
          hint: 'Required, maximum 10 characters',
          required: true
        },
        long_work_code: { 
          tab: ['general'],
          enabled: true, 
          readonly: false, 
          visible: true,
          label: 'Long Work Code',
          hint: 'Required, maximum 50 characters',
          required: true
        },
        description: { 
          tab: ['details'],
          enabled: true, 
          readonly: false, 
          visible: true,
          label: 'Description',
          hint: 'Optional detailed description',
          required: false
        },
        status: { 
          tab: ['general'],
          enabled: true, 
          readonly: false, 
          visible: true,
          label: 'Status',
          hint: '',
          required: false
        }
      },
      actions: {
        add: { 
          enabled: true, 
          visible: true 
        },
        edit: { 
          enabled: true, 
          visible: true 
        },
        delete: { 
          enabled: true, 
          visible: true 
        },
        save: { 
          enabled: true, 
          visible: true 
        },
        cancel: { 
          enabled: true, 
          visible: true 
        }
      }
    };
  }

  /**
   * Get configuration with priority: Cache → API → Default
   * First checks if configuration is cached
   * Then attempts to fetch from API
   * Falls back to default configuration if API fails
   * 
   * @returns Promise with WorkCodePageConfig
   */
  async getConfig(): Promise<WorkCodePageConfig> {
    // Return cached config if available
    if (this.config) {
      return this.config;
    }

    // Try to fetch from API
    const apiConfig = await this.getConfigFromApi(this.MODULE_CODE);
    
    if (apiConfig && this.validateConfig(apiConfig)) {
      this.config = apiConfig;
      return apiConfig;
    }

    // Fallback to default
    this.config = this.getDefaultPageConfig();
    return this.config;
  }

  /**
   * Save configuration to API and update cache
   * 
   * @param config - Configuration to save
   * @returns Promise with boolean indicating success
   */
  async saveConfig(config: WorkCodePageConfig): Promise<boolean> {
    if (!this.validateConfig(config)) {
      console.error('Invalid configuration provided');
      return false;
    }

    const success = await this.saveConfigToApi(this.MODULE_CODE, config);
    
    if (success) {
      this.config = config; // Update cache
    }
    
    return success;
  }

  /**
   * Clear cached configuration
   * Forces next getConfig() call to fetch fresh data
   */
  clearCache(): void {
    this.config = null;
  }

  /**
   * Get column configuration by key
   * 
   * @param key - Column key (e.g., 'work_code_id', 'prefix')
   * @returns ColumnConfig or undefined if not found
   */
  getColumnConfig(key: string) {
    return this.getDefaultPageConfig().columns[key];
  }

  /**
   * Get field configuration by key
   * 
   * @param key - Field key (e.g., 'short_work_code', 'description')
   * @returns FieldConfig or undefined if not found
   */
  getFieldConfig(key: string) {
    return this.getDefaultPageConfig().fields[key];
  }

  /**
   * Get action configuration by key
   * 
   * @param key - Action key (e.g., 'add', 'edit', 'delete')
   * @returns ActionConfig or undefined if not found
   */
  getActionConfig(key: string) {
    return this.getDefaultPageConfig().actions[key];
  }

  /**
   * Get list of visible column keys
   * 
   * @returns Array of column keys where visible is true
   */
  getVisibleColumns(): string[] {
    const config = this.getDefaultPageConfig();
    return Object.entries(config.columns)
      .filter(([_, c]) => c.visible)
      .map(([k]) => k);
  }

  /**
   * Get list of visible field keys
   * 
   * @returns Array of field keys where visible is true
   */
  getVisibleFields(): string[] {
    const config = this.getDefaultPageConfig();
    return Object.entries(config.fields)
      .filter(([_, f]) => f.visible)
      .map(([k]) => k);
  }

  /**
   * Get list of enabled actions
   * 
   * @returns Array of action keys where enabled is true
   */
  getEnabledActions(): string[] {
    const config = this.getDefaultPageConfig();
    return Object.entries(config.actions)
      .filter(([_, a]) => a.enabled)
      .map(([k]) => k);
  }

  /**
   * Update specific field configuration
   * 
   * @param fieldKey - Field key to update
   * @param updates - Partial FieldConfig with updates
   * @returns Updated WorkCodePageConfig
   */
  updateFieldConfig(fieldKey: string, updates: Partial<any>): WorkCodePageConfig {
    const config = this.getDefaultPageConfig();
    
    if (config.fields[fieldKey]) {
      config.fields[fieldKey] = {
        ...config.fields[fieldKey],
        ...updates
      };
    }
    
    return config;
  }

  /**
   * Toggle field visibility
   * 
   * @param fieldKey - Field key to toggle
   * @returns Updated visibility status
   */
  toggleFieldVisibility(fieldKey: string): boolean {
    const config = this.getDefaultPageConfig();
    
    if (config.fields[fieldKey]) {
      config.fields[fieldKey].visible = !config.fields[fieldKey].visible;
      return config.fields[fieldKey].visible;
    }
    
    return false;
  }
}

// ============================================================================
// Export singleton instance for convenience
// ============================================================================

export const workCodeConfigManager = WorkCodeConfigManager.getInstance();

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Using in a React component
 * 
 * import { workCodeConfigManager } from '../../config/workcode.config';
 * 
 * const WorkCodeManagement = () => {
 *   const [config, setConfig] = useState(null);
 * 
 *   useEffect(() => {
 *     // Load config asynchronously
 *     workCodeConfigManager.getConfig().then(cfg => {
 *       setConfig(cfg);
 *     });
 *   }, []);
 * 
 *   // Or use default config synchronously
 *   const pageConfig = workCodeConfigManager.getDefaultPageConfig();
 *   
 *   return <div>...</div>;
 * };
 */

/**
 * Example 2: Getting specific configurations
 * 
 * const visibleColumns = workCodeConfigManager.getVisibleColumns();
 * // Returns: ['work_code_id', 'prefix', 'suffix', ...]
 * 
 * const fieldConfig = workCodeConfigManager.getFieldConfig('short_work_code');
 * // Returns: { enabled: true, readonly: false, visible: true, ... }
 * 
 * const actionConfig = workCodeConfigManager.getActionConfig('add');
 * // Returns: { enabled: true, visible: true }
 */

/**
 * Example 3: Updating configuration
 * 
 * // Update and save configuration
 * const updateConfig = async () => {
 *   const config = workCodeConfigManager.getDefaultPageConfig();
 *   config.fields.description.required = true;
 *   
 *   const success = await workCodeConfigManager.saveConfig(config);
 *   if (success) {
 *     console.log('Configuration saved successfully');
 *   }
 * };
 */

/**
 * Example 4: Clear cache and reload
 * 
 * const reloadConfig = async () => {
 *   workCodeConfigManager.clearCache();
 *   const freshConfig = await workCodeConfigManager.getConfig();
 *   console.log('Fresh configuration loaded:', freshConfig);
 * };
 */
