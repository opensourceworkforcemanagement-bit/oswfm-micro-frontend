// ============================================================================
// src/config/user.config.ts
// User Management Configuration Manager
// ============================================================================

import { BaseConfigManager } from './config.manager';
import { UserPageConfig } from '../types/user.types';

/**
 * Configuration Manager for User Management Module
 * Implements singleton pattern to ensure single instance across application
 * Provides comprehensive methods to access and manage user management configurations
 * Includes columns, filters, fields, roles, worker types, pagination, and actions
 */
export class UserManagementConfigManager extends BaseConfigManager<UserPageConfig> {
  private static instance: UserManagementConfigManager;
  private config: UserPageConfig | null = null;
  private readonly MODULE_CODE = 'user_management';

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    super();
  }

  /**
   * Get singleton instance of UserManagementConfigManager
   * Ensures only one instance exists throughout the application
   * 
   * @returns Single instance of UserManagementConfigManager
   */
  static getInstance(): UserManagementConfigManager {
    if (!UserManagementConfigManager.instance) {
      UserManagementConfigManager.instance = new UserManagementConfigManager();
    }
    return UserManagementConfigManager.instance;
  }

  /**
   * Get default page configuration for User Management
   * This configuration includes columns, filters, fields, roles, worker types,
   * pagination settings, and actions
   * 
   * @returns Default UserPageConfig object
   */
  getDefaultPageConfig(): UserPageConfig {
    return {
      columns: {
        userName: { 
          visible: true, 
          label: 'Username' 
        },
        firstName: { 
          visible: true, 
          label: 'First Name' 
        },
        lastName: { 
          visible: true, 
          label: 'Last Name' 
        },
        role: { 
          visible: true, 
          label: 'Role' 
        },
        org: { 
          visible: true, 
          label: 'Organization' 
        },
        status: { 
          visible: true, 
          label: 'Status' 
        }
      },
      filters: {
        userName: { 
          enabled: true, 
          readonly: false, 
          visible: true, 
          label: 'Username', 
          hint: '', 
          required: false 
        },
        firstName: { 
          enabled: true, 
          readonly: false, 
          visible: true, 
          label: 'First Name', 
          hint: '', 
          required: false 
        },
        lastName: { 
          enabled: true, 
          readonly: false, 
          visible: true, 
          label: 'Last Name', 
          hint: '', 
          required: false 
        },
        org: { 
          enabled: true, 
          readonly: false, 
          visible: true, 
          label: 'Organization', 
          hint: '', 
          required: false 
        },
        role: { 
          enabled: true, 
          readonly: false, 
          visible: true, 
          label: 'Role', 
          hint: '', 
          required: false 
        },
        status: { 
          enabled: true, 
          readonly: false, 
          visible: true, 
          label: 'Status', 
          hint: '', 
          required: false 
        }
      },
      fields: {
        userName: { 
          enabled: true, 
          readonly: false, 
          visible: true, 
          label: 'Username', 
          hint: 'Unique identifier for the user', 
          required: true 
        },
        firstName: { 
          enabled: true, 
          readonly: false, 
          visible: true, 
          label: 'First Name', 
          hint: 'User first name', 
          required: true 
        },
        lastName: { 
          enabled: true, 
          readonly: false, 
          visible: true, 
          label: 'Last Name', 
          hint: 'User last name', 
          required: true 
        },
        org: { 
          enabled: true, 
          readonly: false, 
          visible: true, 
          label: 'Organization', 
          hint: 'Select organization', 
          required: true 
        },
        status: { 
          enabled: true, 
          readonly: false, 
          visible: true, 
          label: 'Status', 
          hint: 'Active or Inactive', 
          required: true 
        },
        hiringDate: { 
          enabled: true, 
          readonly: false, 
          visible: true, 
          label: 'Hiring Date', 
          hint: 'Date employee was hired', 
          required: true 
        },
        lastDate: { 
          enabled: true, 
          readonly: false, 
          visible: true, 
          label: 'Last Date', 
          hint: 'Last working date (if applicable)', 
          required: false 
        },
        workerType: { 
          enabled: true, 
          readonly: false, 
          visible: true, 
          label: 'Type of Worker', 
          hint: 'Employment type', 
          required: true 
        }
      },
      roles: {
        Admin: { 
          enabled: true, 
          visible: true, 
          label: 'Administrator' 
        },
        Developer: { 
          enabled: true, 
          visible: true, 
          label: 'Developer' 
        },
        Supervisor: { 
          enabled: true, 
          visible: true, 
          label: 'Supervisor' 
        },
        TimeKeeper: { 
          enabled: true, 
          visible: true, 
          label: 'Time Keeper' 
        }
      },
      workerTypes: {
        Hourly: { 
          enabled: true, 
          visible: true, 
          label: 'Hourly' 
        },
        'Full Time': { 
          enabled: true, 
          visible: true, 
          label: 'Full Time' 
        },
        'Part Time': { 
          enabled: true, 
          visible: true, 
          label: 'Part Time' 
        }
      },
      pagination: {
        enabled: true,
        defaultPageSize: 10,
        pageSizeOptions: [10, 25, 100]
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
        },
        rowClickToEdit: { 
          enabled: true, 
          visible: true 
        },
        editButton: { 
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
   * @returns Promise with UserPageConfig
   */
  async getConfig(): Promise<UserPageConfig> {
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
  async saveConfig(config: UserPageConfig): Promise<boolean> {
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
   * @param key - Column key (e.g., 'userName', 'firstName')
   * @returns ColumnConfig or undefined if not found
   */
  getColumnConfig(key: string) {
    return this.getDefaultPageConfig().columns[key];
  }

  /**
   * Get field configuration by key
   * 
   * @param key - Field key (e.g., 'userName', 'hiringDate')
   * @returns FieldConfig or undefined if not found
   */
  getFieldConfig(key: string) {
    return this.getDefaultPageConfig().fields[key];
  }

  /**
   * Get filter configuration by key
   * 
   * @param key - Filter key (e.g., 'userName', 'status')
   * @returns FieldConfig or undefined if not found
   */
  getFilterConfig(key: string) {
    return this.getDefaultPageConfig().filters[key];
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
   * Get list of visible filter keys
   * 
   * @returns Array of filter keys where visible is true
   */
  getVisibleFilters(): string[] {
    const config = this.getDefaultPageConfig();
    return Object.entries(config.filters)
      .filter(([_, f]) => f.visible)
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
   * Get list of available roles (enabled and visible)
   * 
   * @returns Array of role keys
   */
  getAvailableRoles(): string[] {
    const config = this.getDefaultPageConfig();
    return Object.entries(config.roles)
      .filter(([_, r]) => r.visible && r.enabled)
      .map(([k]) => k);
  }

  /**
   * Get list of available worker types (enabled and visible)
   * 
   * @returns Array of worker type keys
   */
  getAvailableWorkerTypes(): string[] {
    const config = this.getDefaultPageConfig();
    return Object.entries(config.workerTypes)
      .filter(([_, w]) => w.visible && w.enabled)
      .map(([k]) => k);
  }

  /**
   * Get pagination configuration
   * 
   * @returns PaginationConfig object
   */
  getPaginationConfig() {
    return this.getDefaultPageConfig().pagination;
  }

  /**
   * Get role configuration by key
   * 
   * @param key - Role key (e.g., 'Admin', 'Developer')
   * @returns Role configuration or undefined
   */
  getRoleConfig(key: string) {
    return this.getDefaultPageConfig().roles[key];
  }

  /**
   * Get worker type configuration by key
   * 
   * @param key - Worker type key (e.g., 'Hourly', 'Full Time')
   * @returns Worker type configuration or undefined
   */
  getWorkerTypeConfig(key: string) {
    return this.getDefaultPageConfig().workerTypes[key];
  }

  /**
   * Update specific field configuration
   * 
   * @param fieldKey - Field key to update
   * @param updates - Partial FieldConfig with updates
   * @returns Updated UserPageConfig
   */
  updateFieldConfig(fieldKey: string, updates: Partial<any>): UserPageConfig {
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
   * Toggle role availability
   * 
   * @param roleKey - Role key to toggle
   * @returns Updated enabled status
   */
  toggleRoleEnabled(roleKey: string): boolean {
    const config = this.getDefaultPageConfig();
    
    if (config.roles[roleKey]) {
      config.roles[roleKey].enabled = !config.roles[roleKey].enabled;
      return config.roles[roleKey].enabled;
    }
    
    return false;
  }

  /**
   * Add custom role
   * 
   * @param roleKey - Unique role identifier
   * @param roleLabel - Display label for role
   * @returns Updated configuration
   */
  addRole(roleKey: string, roleLabel: string): UserPageConfig {
    const config = this.getDefaultPageConfig();
    
    config.roles[roleKey] = {
      enabled: true,
      visible: true,
      label: roleLabel
    };
    
    return config;
  }

  /**
   * Add custom worker type
   * 
   * @param typeKey - Unique worker type identifier
   * @param typeLabel - Display label for worker type
   * @returns Updated configuration
   */
  addWorkerType(typeKey: string, typeLabel: string): UserPageConfig {
    const config = this.getDefaultPageConfig();
    
    config.workerTypes[typeKey] = {
      enabled: true,
      visible: true,
      label: typeLabel
    };
    
    return config;
  }

  /**
   * Update pagination settings
   * 
   * @param pageSize - New default page size
   * @param options - Array of page size options
   * @returns Updated configuration
   */
  updatePaginationConfig(pageSize?: number, options?: number[]): UserPageConfig {
    const config = this.getDefaultPageConfig();
    
    if (pageSize) {
      config.pagination.defaultPageSize = pageSize;
    }
    
    if (options) {
      config.pagination.pageSizeOptions = options;
    }
    
    return config;
  }
}

// ============================================================================
// Export singleton instance for convenience
// ============================================================================

export const userManagementConfigManager = UserManagementConfigManager.getInstance();

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Using in a React component
 * 
 * import { userManagementConfigManager } from '../../config/user.config';
 * 
 * const UserManagement = () => {
 *   const [config, setConfig] = useState(null);
 * 
 *   useEffect(() => {
 *     // Load config asynchronously
 *     userManagementConfigManager.getConfig().then(cfg => {
 *       setConfig(cfg);
 *     });
 *   }, []);
 * 
 *   // Or use default config synchronously
 *   const pageConfig = userManagementConfigManager.getDefaultPageConfig();
 *   
 *   return <div>...</div>;
 * };
 */

/**
 * Example 2: Getting specific configurations
 * 
 * const visibleColumns = userManagementConfigManager.getVisibleColumns();
 * // Returns: ['userName', 'firstName', 'lastName', ...]
 * 
 * const availableRoles = userManagementConfigManager.getAvailableRoles();
 * // Returns: ['Admin', 'Developer', 'Supervisor', 'TimeKeeper']
 * 
 * const workerTypes = userManagementConfigManager.getAvailableWorkerTypes();
 * // Returns: ['Hourly', 'Full Time', 'Part Time']
 * 
 * const paginationConfig = userManagementConfigManager.getPaginationConfig();
 * // Returns: { enabled: true, defaultPageSize: 10, pageSizeOptions: [10, 25, 100] }
 */

/**
 * Example 3: Updating configuration
 * 
 * // Add a new role
 * userManagementConfigManager.addRole('Manager', 'Manager');
 * 
 * // Update pagination
 * userManagementConfigManager.updatePaginationConfig(25, [10, 25, 50, 100]);
 * 
 * // Save configuration
 * const config = userManagementConfigManager.getDefaultPageConfig();
 * const success = await userManagementConfigManager.saveConfig(config);
 */

/**
 * Example 4: Working with filters
 * 
 * const visibleFilters = userManagementConfigManager.getVisibleFilters();
 * const filterConfig = userManagementConfigManager.getFilterConfig('userName');
 * 
 * // Check if filter is enabled
 * if (filterConfig?.enabled) {
 *   // Render filter
 * }
 */
