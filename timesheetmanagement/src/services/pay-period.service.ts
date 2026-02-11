/**
 * Pay Period Service
 * Service for managing pay periods via the pay-periods API
 */

import {
  HttpClient,
  CommonService,
  ApiResponse,
} from './common.services';

import { PayPeriod } from '../types/timesheet.types';

export interface CreatePayPeriodRequest {
  payPeriodTypeId: number;
  startDate: string;
  endDate: string;
  year: number;
  periodNumber: number;
}

export interface UpdatePayPeriodRequest {
  payPeriodTypeId?: number;
  startDate?: string;
  endDate?: string;
  year?: number;
  periodNumber?: number;
}

const PAY_PERIOD_TYPE_OPTIONS = [
  { value: 1, label: 'Weekly' },
  { value: 2, label: 'Bi-Weekly' },
  { value: 3, label: 'Semi-Monthly' },
  { value: 4, label: 'Monthly' },
  { value: 5, label: 'Quarterly' },
  { value: 6, label: 'Annually' },
  { value: 7, label: 'Daily' },
  { value: 8, label: 'Bi-Monthly' },
  { value: 9, label: 'Tri-Weekly' },
  { value: 10, label: 'Four-Weekly' },
  { value: 11, label: 'Custom' },
  { value: 12, label: 'Seasonal' },
];

export class PayPeriodService extends CommonService<PayPeriod> {
  constructor(client: HttpClient) {
    super(client, 'pay-periods');
  }

  async getAllPayPeriods(): Promise<ApiResponse<PayPeriod[]>> {
    return this.getAll();
  }

  async getPayPeriodById(id: number): Promise<ApiResponse<PayPeriod>> {
    return this.getById(id);
  }

  async createPayPeriod(data: CreatePayPeriodRequest): Promise<ApiResponse<PayPeriod>> {
    return this.client.post<PayPeriod>(`/${this.resourcePath}`, data);
  }

  async updatePayPeriod(id: number, data: UpdatePayPeriodRequest): Promise<ApiResponse<PayPeriod>> {
    return this.update(id, data as Partial<PayPeriod>);
  }

  async deletePayPeriod(id: number): Promise<ApiResponse<void>> {
    return this.delete(id);
  }

  static getPayPeriodTypeOptions(): { value: number; label: string }[] {
    return PAY_PERIOD_TYPE_OPTIONS;
  }

  static getPayPeriodTypeLabel(typeId: number): string {
    const option = PAY_PERIOD_TYPE_OPTIONS.find(o => o.value === typeId);
    return option?.label || `Type ${typeId}`;
  }

  static formatPayPeriod(pp: PayPeriod): string {
    const start = new Date(pp.startDate);
    const end = new Date(pp.endDate);
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${fmt(start)} - ${fmt(end)}`;
  }

  static formatDateForInput(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  }
}

export const createPayPeriodService = (client: HttpClient): PayPeriodService => {
  return new PayPeriodService(client);
};

export default PayPeriodService;
