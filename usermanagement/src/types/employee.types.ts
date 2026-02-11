// ============================================================================
// Employees
// ============================================================================

export interface EmployeesRequest {
  employeeIdentifier: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  status?: number;
  userName: string;
}

export interface CreateEmployeeWithUserRequest {
  employeeIdentifier: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  status?: number;
  userName: string;
  createUser: boolean;
  password?: string;
}

export interface Employee {
  employeeId: number;
  employeeIdentifier: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  status: number;
  userName: string;
}

// ============================================================================
// Addresses
// ============================================================================

export interface AddressesRequest {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isPrimary?: boolean;
}

export interface Address {
  addressId: number;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isPrimary?: boolean;
}

// ============================================================================
// Departments
// ============================================================================

export interface DepartmentsRequest {
  department: string;
  description?: string;
  status: number;
}

export interface Department {
  departmentId: number;
  department: string;
  description?: string;
  status: number;
}

// ============================================================================
// Email Addresses
// ============================================================================

export interface EmailAddressesRequest {
  employeeId: number;
  email: string;
  type: number;
  isPrimary?: boolean;
}

export interface EmailAddress {
  emailAddressId: number;
  employeeId: number;
  email: string;
  type: number;
  isPrimary?: boolean;
}

// ============================================================================
// Employee Address (Join)
// ============================================================================

export interface EmployeeAddressRequest {
  employeeId: number;
}

export interface EmployeeAddress {
  addressId: number;
  employeeId: number;
}

// ============================================================================
// Employees Audit Log
// ============================================================================

export interface EmployeesAuditLogRequest {
  employeeId: number;
  action: string;
  actionTimestamp?: string;
  actionBy?: number;
}

export interface EmployeesAuditLog {
  employeeAuditLogId: number;
  employeeId: number;
  action: string;
  actionTimestamp?: string;
  actionBy?: number;
}

// ============================================================================
// Employees Emergency Contacts
// ============================================================================

export interface EmployeesEmergencyContactsRequest {
  employeeId: number;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  relationship?: string;
}

export interface EmployeesEmergencyContact {
  emergencyContactId: number;
  employeeId: number;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  relationship?: string;
}

// ============================================================================
// Employees Emergency Contact Emails
// ============================================================================

export interface EmployeesEmergencyContactEmailsRequest {
  emergencyContactId: number;
  emailAddressId: number;
}

export interface EmployeesEmergencyContactEmail {
  emergencyContactEmailId: number;
  emergencyContactId: number;
  emailAddressId: number;
}

// ============================================================================
// Employees Emergency Contact Phone Numbers
// ============================================================================

export interface EmployeesEmergencyContactPhoneNumbersRequest {
  emergencyContactId: number;
  phoneNumberId: number;
}

export interface EmployeesEmergencyContactPhoneNumber {
  emergencyContactInfoId: number;
  emergencyContactId: number;
  phoneNumberId: number;
}

// ============================================================================
// Employees Preferences
// ============================================================================

export interface EmployeesPreferencesRequest {
  employeeId: number;
  preferenceKey: string;
  preferenceDescription?: string;
}

export interface EmployeesPreference {
  employeePreferenceId: number;
  employeeId: number;
  preferenceKey: string;
  preferenceDescription?: string;
}

// ============================================================================
// Employees Roles
// ============================================================================

export interface EmployeesRolesRequest {
  role: string;
  description?: string;
}

export interface EmployeesRole {
  employeeRoleId: number;
  role: string;
  description?: string;
}

// ============================================================================
// Employees Settings
// ============================================================================

export interface EmployeesSettingsRequest {
  employeeId: number;
  settingKey: string;
  settingDescription?: string;
}

export interface EmployeesSetting {
  employeeSettingId: number;
  employeeId: number;
  settingKey: string;
  settingDescription?: string;
}

// ============================================================================
// Employees SSN
// ============================================================================

export interface EmployeesSsnRequest {
  employeeId: number;
  ssn: string;
}

export interface EmployeesSsn {
  employeeSsnId: number;
  employeeId: number;
  ssn: string;
}

// ============================================================================
// Employees Status History
// ============================================================================

export interface EmployeesStatusHistoryRequest {
  employeeId: number;
  status: number;
  changedAt?: string;
  changedByEmployeeId?: number;
}

export interface EmployeesStatusHistory {
  employeeStatusHistoryId: number;
  employeeId: number;
  status: number;
  changedAt?: string;
  changedByEmployeeId?: number;
}

// ============================================================================
// Organization
// ============================================================================

export interface OrganizationRequest {
  parentOrganizationId?: number;
  organization: string;
  description?: string;
  status: number;
}

export interface Organization {
  organizationId: number;
  parentOrganizationId?: number;
  organization: string;
  description?: string;
  status: number;
}

// ============================================================================
// Permissions
// ============================================================================

export interface PermissionsRequest {
  permissionTag: number;
  permissionName: string;
  description?: string;
}

export interface Permission {
  permissioinsId: number;
  permissionTag: number;
  permissionName: string;
  description?: string;
}

// ============================================================================
// Phone Numbers
// ============================================================================

export interface PhoneNumbersRequest {
  employeeId: number;
  phoneNumber: string;
  type: number;
  isPrimary?: boolean;
}

export interface PhoneNumber {
  phoneNumberId: number;
  employeeId: number;
  phoneNumber: string;
  type: number;
  isPrimary?: boolean;
}

// ============================================================================
// Projects
// ============================================================================

export interface ProjectsRequest {
  project: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: number;
}

export interface Project {
  projectId: number;
  project: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: number;
}

// ============================================================================
// Role Permissions
// ============================================================================

export interface RolePermissionsRequest {
  employeeRoleId: string;
  permissioinsId: number;
}

export interface RolePermission {
  rolePermissionId: number;
  employeeRoleId: string;
  permissioinsId: number;
}

// ============================================================================
// Employee User (Join)
// ============================================================================

export interface EmployeeUserRequest {
  employeeId: number;
  userId: number;
}

export interface EmployeeUser {
  employeeUserId: number;
  employeeId: number;
  userId: number;
}
