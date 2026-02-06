/**
 * Employee Service
 * Service for fetching employees from the employee API
 */

import {
  HttpClient,
  CommonService,
  ApiResponse,
} from './common.services';

import { Employee } from '../types/employee.type.ts';

export class EmployeeService extends CommonService<Employee> {
  constructor(client: HttpClient) {
    super(client, 'employees');
  }

  /**
   * Get all employees
   */
  async getAllEmployees(): Promise<ApiResponse<Employee[]>> {
    return this.getAll();
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(id: number): Promise<ApiResponse<Employee>> {
    return this.getById(id);
  }
}

export const createEmployeeService = (client: HttpClient): EmployeeService => {
  return new EmployeeService(client);
};

export default EmployeeService;
