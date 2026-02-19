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
    const toDate = (v: Date | string | number[]) => {
      if (Array.isArray(v)) return new Date(v[0], v[1] - 1, v[2]);
      return new Date(v as string | number);
    };
    const start = toDate(pp.startDate as Date | string | number[]);
    const end = toDate(pp.endDate as Date | string | number[]);
    const fmt = (d: Date) => isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${fmt(start)} - ${fmt(end)}`;
  }

  static formatDateForInput(date: Date | string | number[]): string {
    let d: Date;
    if (Array.isArray(date)) {
      // Java LocalDate serializes as [year, month, day]
      d = new Date(date[0], date[1] - 1, date[2]);
    } else if (typeof date === 'string') {
      d = new Date(date);
    } else if (date instanceof Date) {
      d = date;
    } else {
      return '';
    }
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export const createPayPeriodService = (client: HttpClient): PayPeriodService => {
  return new PayPeriodService(client);
};

export default PayPeriodService;
