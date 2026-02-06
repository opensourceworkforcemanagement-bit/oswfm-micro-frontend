/**
 * Employee Service
 * Services for all employee-related API endpoints
 * Each service class maps to a backend controller in the userservice
 */

import {
  HttpClient,
  CommonService,
  ApiResponse,
} from './common.services.ts';

import {
  Employee, EmployeesRequest,
  Address, AddressesRequest,
  Department, DepartmentsRequest,
  EmailAddress, EmailAddressesRequest,
  EmployeeAddress, EmployeeAddressRequest,
  EmployeesAuditLog, EmployeesAuditLogRequest,
  EmployeesEmergencyContact, EmployeesEmergencyContactsRequest,
  EmployeesEmergencyContactEmail, EmployeesEmergencyContactEmailsRequest,
  EmployeesEmergencyContactPhoneNumber, EmployeesEmergencyContactPhoneNumbersRequest,
  EmployeesPreference, EmployeesPreferencesRequest,
  EmployeesRole, EmployeesRolesRequest,
  EmployeesSetting, EmployeesSettingsRequest,
  EmployeesSsn, EmployeesSsnRequest,
  EmployeesStatusHistory, EmployeesStatusHistoryRequest,
  Organization, OrganizationRequest,
  Permission, PermissionsRequest,
  PhoneNumber, PhoneNumbersRequest,
  Project, ProjectsRequest,
  RolePermission, RolePermissionsRequest,
  EmployeeUser, EmployeeUserRequest,
} from '../types/employee.types.ts';

// ============================================================================
// Base CRUD Service (all controllers share this pattern)
// ============================================================================

class CrudService<TResponse, TRequest = Partial<TResponse>> extends CommonService<TResponse> {
  constructor(client: HttpClient, resourcePath: string) {
    super(client, resourcePath);
  }

  async createOne(data: TRequest): Promise<ApiResponse<TResponse>> {
    return this.client.post<TResponse>(`/${this.resourcePath}`, data);
  }

  async updateOne(id: number, data: TRequest): Promise<ApiResponse<TResponse>> {
    return this.client.put<TResponse>(`/${this.resourcePath}/${id}`, data);
  }

  async deleteOne(id: number): Promise<ApiResponse<void>> {
    return this.client.delete<void>(`/${this.resourcePath}/${id}`);
  }

  async exists(id: number): Promise<ApiResponse<void>> {
    return this.client.request<void>(`/${this.resourcePath}/${id}`, { method: 'GET' });
  }

  async count(): Promise<ApiResponse<number>> {
    return this.client.get<number>(`/${this.resourcePath}/count`);
  }
}

// ============================================================================
// Employees - /api/v1/employees
// ============================================================================

export class EmployeeService extends CrudService<Employee, EmployeesRequest> {
  constructor(client: HttpClient) {
    super(client, 'employees');
  }

  async createEmployee(data: EmployeesRequest): Promise<ApiResponse<Employee>> {
    return this.client.post<Employee>(`/${this.resourcePath}/create`, data);
  }

  async getAllEmployees(): Promise<ApiResponse<Employee[]>> {
    return this.getAll();
  }

  async getEmployeeById(id: number): Promise<ApiResponse<Employee>> {
    return this.getById(id);
  }

  async updateEmployee(id: number, data: EmployeesRequest): Promise<ApiResponse<Employee>> {
    return this.updateOne(id, data);
  }

  async deleteEmployee(id: number): Promise<ApiResponse<void>> {
    return this.deleteOne(id);
  }

  async employeeExists(id: number): Promise<ApiResponse<void>> {
    return this.exists(id);
  }

  async getEmployeeCount(): Promise<ApiResponse<number>> {
    return this.count();
  }
}

// ============================================================================
// Addresses - /api/v1/addresses
// ============================================================================

export class AddressesService extends CrudService<Address, AddressesRequest> {
  constructor(client: HttpClient) {
    super(client, 'addresses');
  }

  async createAddress(data: AddressesRequest): Promise<ApiResponse<Address>> {
    return this.createOne(data);
  }

  async getAllAddresses(): Promise<ApiResponse<Address[]>> {
    return this.getAll();
  }

  async getAddressById(id: number): Promise<ApiResponse<Address>> {
    return this.getById(id);
  }

  async updateAddress(id: number, data: AddressesRequest): Promise<ApiResponse<Address>> {
    return this.updateOne(id, data);
  }

  async deleteAddress(id: number): Promise<ApiResponse<void>> {
    return this.deleteOne(id);
  }

  async getAddressCount(): Promise<ApiResponse<number>> {
    return this.count();
  }
}

// ============================================================================
// Departments - /api/v1/departments
// ============================================================================

export class DepartmentsService extends CrudService<Department, DepartmentsRequest> {
  constructor(client: HttpClient) {
    super(client, 'departments');
  }

  async createDepartment(data: DepartmentsRequest): Promise<ApiResponse<Department>> {
    return this.createOne(data);
  }

  async getAllDepartments(): Promise<ApiResponse<Department[]>> {
    return this.getAll();
  }

  async getDepartmentById(id: number): Promise<ApiResponse<Department>> {
    return this.getById(id);
  }

  async updateDepartment(id: number, data: DepartmentsRequest): Promise<ApiResponse<Department>> {
    return this.updateOne(id, data);
  }

  async deleteDepartment(id: number): Promise<ApiResponse<void>> {
    return this.deleteOne(id);
  }

  async getDepartmentCount(): Promise<ApiResponse<number>> {
    return this.count();
  }
}

// ============================================================================
// Email Addresses - /api/v1/email-addresses
// ============================================================================

export class EmailAddressesService extends CrudService<EmailAddress, EmailAddressesRequest> {
  constructor(client: HttpClient) {
    super(client, 'email-addresses');
  }

  async createEmailAddress(data: EmailAddressesRequest): Promise<ApiResponse<EmailAddress>> {
    return this.createOne(data);
  }

  async getAllEmailAddresses(): Promise<ApiResponse<EmailAddress[]>> {
    return this.getAll();
  }

  async getEmailAddressById(id: number): Promise<ApiResponse<EmailAddress>> {
    return this.getById(id);
  }

  async updateEmailAddress(id: number, data: EmailAddressesRequest): Promise<ApiResponse<EmailAddress>> {
    return this.updateOne(id, data);
  }

  async deleteEmailAddress(id: number): Promise<ApiResponse<void>> {
    return this.deleteOne(id);
  }

  async getEmailAddressCount(): Promise<ApiResponse<number>> {
    return this.count();
  }
}

// ============================================================================
// Employee Address - /api/v1/employee-address
// ============================================================================

export class EmployeeAddressService extends CrudService<EmployeeAddress, EmployeeAddressRequest> {
  constructor(client: HttpClient) {
    super(client, 'employee-address');
  }

  async createEmployeeAddress(data: EmployeeAddressRequest): Promise<ApiResponse<EmployeeAddress>> {
    return this.createOne(data);
  }

  async getAllEmployeeAddresses(): Promise<ApiResponse<EmployeeAddress[]>> {
    return this.getAll();
  }

  async getEmployeeAddressById(id: number): Promise<ApiResponse<EmployeeAddress>> {
    return this.getById(id);
  }

  async updateEmployeeAddress(id: number, data: EmployeeAddressRequest): Promise<ApiResponse<EmployeeAddress>> {
    return this.updateOne(id, data);
  }

  async deleteEmployeeAddress(id: number): Promise<ApiResponse<void>> {
    return this.deleteOne(id);
  }

  async getEmployeeAddressCount(): Promise<ApiResponse<number>> {
    return this.count();
  }
}

// ============================================================================
// Employees Audit Log - /api/v1/employees-audit-log
// ============================================================================

export class EmployeesAuditLogService extends CrudService<EmployeesAuditLog, EmployeesAuditLogRequest> {
  constructor(client: HttpClient) {
    super(client, 'employees-audit-log');
  }

  async createAuditLog(data: EmployeesAuditLogRequest): Promise<ApiResponse<EmployeesAuditLog>> {
    return this.createOne(data);
  }

  async getAllAuditLogs(): Promise<ApiResponse<EmployeesAuditLog[]>> {
    return this.getAll();
  }

  async getAuditLogById(id: number): Promise<ApiResponse<EmployeesAuditLog>> {
    return this.getById(id);
  }

  async updateAuditLog(id: number, data: EmployeesAuditLogRequest): Promise<ApiResponse<EmployeesAuditLog>> {
    return this.updateOne(id, data);
  }

  async deleteAuditLog(id: number): Promise<ApiResponse<void>> {
    return this.deleteOne(id);
  }

  async getAuditLogCount(): Promise<ApiResponse<number>> {
    return this.count();
  }
}

// ============================================================================
// Employees Emergency Contacts - /api/v1/employees-emergency-contacts
// ============================================================================

export class EmployeesEmergencyContactsService extends CrudService<EmployeesEmergencyContact, EmployeesEmergencyContactsRequest> {
  constructor(client: HttpClient) {
    super(client, 'employees-emergency-contacts');
  }

  async createEmergencyContact(data: EmployeesEmergencyContactsRequest): Promise<ApiResponse<EmployeesEmergencyContact>> {
    return this.createOne(data);
  }

  async getAllEmergencyContacts(): Promise<ApiResponse<EmployeesEmergencyContact[]>> {
    return this.getAll();
  }

  async getEmergencyContactById(id: number): Promise<ApiResponse<EmployeesEmergencyContact>> {
    return this.getById(id);
  }

  async updateEmergencyContact(id: number, data: EmployeesEmergencyContactsRequest): Promise<ApiResponse<EmployeesEmergencyContact>> {
    return this.updateOne(id, data);
  }

  async deleteEmergencyContact(id: number): Promise<ApiResponse<void>> {
    return this.deleteOne(id);
  }

  async getEmergencyContactCount(): Promise<ApiResponse<number>> {
    return this.count();
  }
}

// ============================================================================
// Employees Emergency Contact Emails - /api/v1/employees-emergency-contact-emails
// ============================================================================

export class EmployeesEmergencyContactEmailsService extends CrudService<EmployeesEmergencyContactEmail, EmployeesEmergencyContactEmailsRequest> {
  constructor(client: HttpClient) {
    super(client, 'employees-emergency-contact-emails');
  }

  async createEmergencyContactEmail(data: EmployeesEmergencyContactEmailsRequest): Promise<ApiResponse<EmployeesEmergencyContactEmail>> {
    return this.createOne(data);
  }

  async getAllEmergencyContactEmails(): Promise<ApiResponse<EmployeesEmergencyContactEmail[]>> {
    return this.getAll();
  }

  async getEmergencyContactEmailById(id: number): Promise<ApiResponse<EmployeesEmergencyContactEmail>> {
    return this.getById(id);
  }

  async updateEmergencyContactEmail(id: number, data: EmployeesEmergencyContactEmailsRequest): Promise<ApiResponse<EmployeesEmergencyContactEmail>> {
    return this.updateOne(id, data);
  }

  async deleteEmergencyContactEmail(id: number): Promise<ApiResponse<void>> {
    return this.deleteOne(id);
  }

  async getEmergencyContactEmailCount(): Promise<ApiResponse<number>> {
    return this.count();
  }
}

// ============================================================================
// Employees Emergency Contact Phone Numbers - /api/v1/employees-emergency-contact-phone-numbers
// ============================================================================

export class EmployeesEmergencyContactPhoneNumbersService extends CrudService<EmployeesEmergencyContactPhoneNumber, EmployeesEmergencyContactPhoneNumbersRequest> {
  constructor(client: HttpClient) {
    super(client, 'employees-emergency-contact-phone-numbers');
  }

  async createEmergencyContactPhoneNumber(data: EmployeesEmergencyContactPhoneNumbersRequest): Promise<ApiResponse<EmployeesEmergencyContactPhoneNumber>> {
    return this.createOne(data);
  }

  async getAllEmergencyContactPhoneNumbers(): Promise<ApiResponse<EmployeesEmergencyContactPhoneNumber[]>> {
    return this.getAll();
  }

  async getEmergencyContactPhoneNumberById(id: number): Promise<ApiResponse<EmployeesEmergencyContactPhoneNumber>> {
    return this.getById(id);
  }

  async updateEmergencyContactPhoneNumber(id: number, data: EmployeesEmergencyContactPhoneNumbersRequest): Promise<ApiResponse<EmployeesEmergencyContactPhoneNumber>> {
    return this.updateOne(id, data);
  }

  async deleteEmergencyContactPhoneNumber(id: number): Promise<ApiResponse<void>> {
    return this.deleteOne(id);
  }

  async getEmergencyContactPhoneNumberCount(): Promise<ApiResponse<number>> {
    return this.count();
  }
}

// ============================================================================
// Employees Preferences - /api/v1/employees-preferences
// ============================================================================

export class EmployeesPreferencesService extends CrudService<EmployeesPreference, EmployeesPreferencesRequest> {
  constructor(client: HttpClient) {
    super(client, 'employees-preferences');
  }

  async createPreference(data: EmployeesPreferencesRequest): Promise<ApiResponse<EmployeesPreference>> {
    return this.createOne(data);
  }

  async getAllPreferences(): Promise<ApiResponse<EmployeesPreference[]>> {
    return this.getAll();
  }

  async getPreferenceById(id: number): Promise<ApiResponse<EmployeesPreference>> {
    return this.getById(id);
  }

  async updatePreference(id: number, data: EmployeesPreferencesRequest): Promise<ApiResponse<EmployeesPreference>> {
    return this.updateOne(id, data);
  }

  async deletePreference(id: number): Promise<ApiResponse<void>> {
    return this.deleteOne(id);
  }

  async getPreferenceCount(): Promise<ApiResponse<number>> {
    return this.count();
  }
}

// ============================================================================
// Employees Roles - /api/v1/employees-roles
// ============================================================================

export class EmployeesRolesService extends CrudService<EmployeesRole, EmployeesRolesRequest> {
  constructor(client: HttpClient) {
    super(client, 'employees-roles');
  }

  async createRole(data: EmployeesRolesRequest): Promise<ApiResponse<EmployeesRole>> {
    return this.createOne(data);
  }

  async getAllRoles(): Promise<ApiResponse<EmployeesRole[]>> {
    return this.getAll();
  }

  async getRoleById(id: number): Promise<ApiResponse<EmployeesRole>> {
    return this.getById(id);
  }

  async updateRole(id: number, data: EmployeesRolesRequest): Promise<ApiResponse<EmployeesRole>> {
    return this.updateOne(id, data);
  }

  async deleteRole(id: number): Promise<ApiResponse<void>> {
    return this.deleteOne(id);
  }

  async getRoleCount(): Promise<ApiResponse<number>> {
    return this.count();
  }
}

// ============================================================================
// Employees Settings - /api/v1/employees-settings
// ============================================================================

export class EmployeesSettingsService extends CrudService<EmployeesSetting, EmployeesSettingsRequest> {
  constructor(client: HttpClient) {
    super(client, 'employees-settings');
  }

  async createSetting(data: EmployeesSettingsRequest): Promise<ApiResponse<EmployeesSetting>> {
    return this.createOne(data);
  }

  async getAllSettings(): Promise<ApiResponse<EmployeesSetting[]>> {
    return this.getAll();
  }

  async getSettingById(id: number): Promise<ApiResponse<EmployeesSetting>> {
    return this.getById(id);
  }

  async updateSetting(id: number, data: EmployeesSettingsRequest): Promise<ApiResponse<EmployeesSetting>> {
    return this.updateOne(id, data);
  }

  async deleteSetting(id: number): Promise<ApiResponse<void>> {
    return this.deleteOne(id);
  }

  async getSettingCount(): Promise<ApiResponse<number>> {
    return this.count();
  }
}

// ============================================================================
// Employees SSN - /api/v1/employees-ssn
// ============================================================================

export class EmployeesSsnService extends CrudService<EmployeesSsn, EmployeesSsnRequest> {
  constructor(client: HttpClient) {
    super(client, 'employees-ssn');
  }

  async createSsn(data: EmployeesSsnRequest): Promise<ApiResponse<EmployeesSsn>> {
    return this.createOne(data);
  }

  async getAllSsns(): Promise<ApiResponse<EmployeesSsn[]>> {
    return this.getAll();
  }

  async getSsnById(id: number): Promise<ApiResponse<EmployeesSsn>> {
    return this.getById(id);
  }

  async updateSsn(id: number, data: EmployeesSsnRequest): Promise<ApiResponse<EmployeesSsn>> {
    return this.updateOne(id, data);
  }

  async deleteSsn(id: number): Promise<ApiResponse<void>> {
    return this.deleteOne(id);
  }

  async getSsnCount(): Promise<ApiResponse<number>> {
    return this.count();
  }
}

// ============================================================================
// Employees Status History - /api/v1/employees-status-history
// ============================================================================

export class EmployeesStatusHistoryService extends CrudService<EmployeesStatusHistory, EmployeesStatusHistoryRequest> {
  constructor(client: HttpClient) {
    super(client, 'employees-status-history');
  }

  async createStatusHistory(data: EmployeesStatusHistoryRequest): Promise<ApiResponse<EmployeesStatusHistory>> {
    return this.createOne(data);
  }

  async getAllStatusHistories(): Promise<ApiResponse<EmployeesStatusHistory[]>> {
    return this.getAll();
  }

  async getStatusHistoryById(id: number): Promise<ApiResponse<EmployeesStatusHistory>> {
    return this.getById(id);
  }

  async updateStatusHistory(id: number, data: EmployeesStatusHistoryRequest): Promise<ApiResponse<EmployeesStatusHistory>> {
    return this.updateOne(id, data);
  }

  async deleteStatusHistory(id: number): Promise<ApiResponse<void>> {
    return this.deleteOne(id);
  }

  async getStatusHistoryCount(): Promise<ApiResponse<number>> {
    return this.count();
  }
}

// ============================================================================
// Organization - /api/v1/organization
// ============================================================================

export class OrganizationService extends CrudService<Organization, OrganizationRequest> {
  constructor(client: HttpClient) {
    super(client, 'organization');
  }

  async createOrganization(data: OrganizationRequest): Promise<ApiResponse<Organization>> {
    return this.createOne(data);
  }

  async getAllOrganizations(): Promise<ApiResponse<Organization[]>> {
    return this.getAll();
  }

  async getOrganizationById(id: number): Promise<ApiResponse<Organization>> {
    return this.getById(id);
  }

  async updateOrganization(id: number, data: OrganizationRequest): Promise<ApiResponse<Organization>> {
    return this.updateOne(id, data);
  }

  async deleteOrganization(id: number): Promise<ApiResponse<void>> {
    return this.deleteOne(id);
  }

  async getOrganizationCount(): Promise<ApiResponse<number>> {
    return this.count();
  }
}

// ============================================================================
// Permissions - /api/v1/permissions
// ============================================================================

export class PermissionsService extends CrudService<Permission, PermissionsRequest> {
  constructor(client: HttpClient) {
    super(client, 'permissions');
  }

  async createPermission(data: PermissionsRequest): Promise<ApiResponse<Permission>> {
    return this.createOne(data);
  }

  async getAllPermissions(): Promise<ApiResponse<Permission[]>> {
    return this.getAll();
  }

  async getPermissionById(id: number): Promise<ApiResponse<Permission>> {
    return this.getById(id);
  }

  async updatePermission(id: number, data: PermissionsRequest): Promise<ApiResponse<Permission>> {
    return this.updateOne(id, data);
  }

  async deletePermission(id: number): Promise<ApiResponse<void>> {
    return this.deleteOne(id);
  }

  async getPermissionCount(): Promise<ApiResponse<number>> {
    return this.count();
  }
}

// ============================================================================
// Phone Numbers - /api/v1/phone-numbers
// ============================================================================

export class PhoneNumbersService extends CrudService<PhoneNumber, PhoneNumbersRequest> {
  constructor(client: HttpClient) {
    super(client, 'phone-numbers');
  }

  async createPhoneNumber(data: PhoneNumbersRequest): Promise<ApiResponse<PhoneNumber>> {
    return this.createOne(data);
  }

  async getAllPhoneNumbers(): Promise<ApiResponse<PhoneNumber[]>> {
    return this.getAll();
  }

  async getPhoneNumberById(id: number): Promise<ApiResponse<PhoneNumber>> {
    return this.getById(id);
  }

  async updatePhoneNumber(id: number, data: PhoneNumbersRequest): Promise<ApiResponse<PhoneNumber>> {
    return this.updateOne(id, data);
  }

  async deletePhoneNumber(id: number): Promise<ApiResponse<void>> {
    return this.deleteOne(id);
  }

  async getPhoneNumberCount(): Promise<ApiResponse<number>> {
    return this.count();
  }
}

// ============================================================================
// Projects - /api/v1/projects
// ============================================================================

export class ProjectsService extends CrudService<Project, ProjectsRequest> {
  constructor(client: HttpClient) {
    super(client, 'projects');
  }

  async createProject(data: ProjectsRequest): Promise<ApiResponse<Project>> {
    return this.createOne(data);
  }

  async getAllProjects(): Promise<ApiResponse<Project[]>> {
    return this.getAll();
  }

  async getProjectById(id: number): Promise<ApiResponse<Project>> {
    return this.getById(id);
  }

  async updateProject(id: number, data: ProjectsRequest): Promise<ApiResponse<Project>> {
    return this.updateOne(id, data);
  }

  async deleteProject(id: number): Promise<ApiResponse<void>> {
    return this.deleteOne(id);
  }

  async getProjectCount(): Promise<ApiResponse<number>> {
    return this.count();
  }
}

// ============================================================================
// Role Permissions - /api/v1/role-permissions
// ============================================================================

export class RolePermissionsService extends CrudService<RolePermission, RolePermissionsRequest> {
  constructor(client: HttpClient) {
    super(client, 'role-permissions');
  }

  async createRolePermission(data: RolePermissionsRequest): Promise<ApiResponse<RolePermission>> {
    return this.createOne(data);
  }

  async getAllRolePermissions(): Promise<ApiResponse<RolePermission[]>> {
    return this.getAll();
  }

  async getRolePermissionById(id: number): Promise<ApiResponse<RolePermission>> {
    return this.getById(id);
  }

  async updateRolePermission(id: number, data: RolePermissionsRequest): Promise<ApiResponse<RolePermission>> {
    return this.updateOne(id, data);
  }

  async deleteRolePermission(id: number): Promise<ApiResponse<void>> {
    return this.deleteOne(id);
  }

  async getRolePermissionCount(): Promise<ApiResponse<number>> {
    return this.count();
  }
}

// ============================================================================
// Employee User - /api/v1/employee-user
// ============================================================================

export class EmployeeUserService extends CrudService<EmployeeUser, EmployeeUserRequest> {
  constructor(client: HttpClient) {
    super(client, 'employee-user');
  }

  async createEmployeeUser(data: EmployeeUserRequest): Promise<ApiResponse<EmployeeUser>> {
    return this.createOne(data);
  }

  async getAllEmployeeUsers(): Promise<ApiResponse<EmployeeUser[]>> {
    return this.getAll();
  }

  async getEmployeeUserById(id: number): Promise<ApiResponse<EmployeeUser>> {
    return this.getById(id);
  }

  async getByEmployeeId(employeeId: number): Promise<ApiResponse<EmployeeUser[]>> {
    return this.client.get<EmployeeUser[]>(`/${this.resourcePath}/employee/${employeeId}`);
  }

  async getByUserId(userId: number): Promise<ApiResponse<EmployeeUser[]>> {
    return this.client.get<EmployeeUser[]>(`/${this.resourcePath}/user/${userId}`);
  }

  async updateEmployeeUser(id: number, data: EmployeeUserRequest): Promise<ApiResponse<EmployeeUser>> {
    return this.updateOne(id, data);
  }

  async deleteEmployeeUser(id: number): Promise<ApiResponse<void>> {
    return this.deleteOne(id);
  }

  async getEmployeeUserCount(): Promise<ApiResponse<number>> {
    return this.count();
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export const createEmployeeService = (client: HttpClient) => new EmployeeService(client);
export const createAddressesService = (client: HttpClient) => new AddressesService(client);
export const createDepartmentsService = (client: HttpClient) => new DepartmentsService(client);
export const createEmailAddressesService = (client: HttpClient) => new EmailAddressesService(client);
export const createEmployeeAddressService = (client: HttpClient) => new EmployeeAddressService(client);
export const createEmployeesAuditLogService = (client: HttpClient) => new EmployeesAuditLogService(client);
export const createEmployeesEmergencyContactsService = (client: HttpClient) => new EmployeesEmergencyContactsService(client);
export const createEmployeesEmergencyContactEmailsService = (client: HttpClient) => new EmployeesEmergencyContactEmailsService(client);
export const createEmployeesEmergencyContactPhoneNumbersService = (client: HttpClient) => new EmployeesEmergencyContactPhoneNumbersService(client);
export const createEmployeesPreferencesService = (client: HttpClient) => new EmployeesPreferencesService(client);
export const createEmployeesRolesService = (client: HttpClient) => new EmployeesRolesService(client);
export const createEmployeesSettingsService = (client: HttpClient) => new EmployeesSettingsService(client);
export const createEmployeesSsnService = (client: HttpClient) => new EmployeesSsnService(client);
export const createEmployeesStatusHistoryService = (client: HttpClient) => new EmployeesStatusHistoryService(client);
export const createOrganizationService = (client: HttpClient) => new OrganizationService(client);
export const createPermissionsService = (client: HttpClient) => new PermissionsService(client);
export const createPhoneNumbersService = (client: HttpClient) => new PhoneNumbersService(client);
export const createProjectsService = (client: HttpClient) => new ProjectsService(client);
export const createRolePermissionsService = (client: HttpClient) => new RolePermissionsService(client);
export const createEmployeeUserService = (client: HttpClient) => new EmployeeUserService(client);
