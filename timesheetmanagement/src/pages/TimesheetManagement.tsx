// src/pages/TimesheetManagement.tsx
import React, { useState, useEffect, useMemo } from 'react';
import * as Select from '@radix-ui/react-select';
import * as Label from '@radix-ui/react-label';
import { Button } from "@radix-ui/themes";
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { ArrowLeft, Plus, Loader2, Search, Check, ChevronDown } from 'lucide-react';
import { MantineProvider } from '@mantine/core';
import { ReactTabulator } from 'react-tabulator';
import 'react-tabulator/css/tabulator.min.css';
import 'react-tabulator/css/bootstrap/tabulator_bootstrap.min.css';
import '../themes/brand-a.css';
import '../index.css';

// Import centralized styles
import { commonClasses, themeClasses, combineClasses } from '../styles/styles.classes.ts';

// Import services
import { TimesheetService } from '../services/timesheet.service.ts';
import { HttpClient } from '../services/common.services.ts';

// Import types
import {
  Timesheet,
  TimesheetEntry,
  TimesheetSummary,
  TimesheetStatus,
  PayPeriod,
  Employee,
  Weeks,
} from '../types/timesheet.types.ts';
import { WorkforceCode } from '../types/workcode.types.ts';

// Import MantineReactTimeSheetTable
import MantineReactTimeSheetTable from '../components/MantineReactTimeSheetTable';

// Initialize service
const httpClient = new HttpClient({ baseURL: 'http://localhost:1110/api/v1' });
const timesheetService = new TimesheetService(httpClient);

// ============================================================================
// Sample Data
// ============================================================================

// Sample Pay Periods
const samplePayPeriods: PayPeriod[] = [
  { payPeriodId: 1, payPeriodTypeId: 1, startDate: new Date('2026-01-05'), endDate: new Date('2026-01-18'), year: 2026, periodNumber: 1 },
  { payPeriodId: 2, payPeriodTypeId: 1, startDate: new Date('2026-01-19'), endDate: new Date('2026-02-01'), year: 2026, periodNumber: 2 },
  { payPeriodId: 3, payPeriodTypeId: 1, startDate: new Date('2026-02-02'), endDate: new Date('2026-02-15'), year: 2026, periodNumber: 3 },
  { payPeriodId: 4, payPeriodTypeId: 1, startDate: new Date('2026-02-16'), endDate: new Date('2026-03-01'), year: 2026, periodNumber: 4 },
];

// Sample Employees
const sampleEmployees: Employee[] = [
  { employeeId: 1, firstName: 'John', lastName: 'Doe', email: 'john.doe@company.com', department: 'Engineering', employeeNumber: 'EMP001' },
  { employeeId: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@company.com', department: 'Marketing', employeeNumber: 'EMP002' },
  { employeeId: 3, firstName: 'Bob', lastName: 'Johnson', email: 'bob.johnson@company.com', department: 'Finance', employeeNumber: 'EMP003' },
  { employeeId: 4, firstName: 'Alice', lastName: 'Williams', email: 'alice.williams@company.com', department: 'HR', employeeNumber: 'EMP004' },
  { employeeId: 5, firstName: 'Charlie', lastName: 'Brown', email: 'charlie.brown@company.com', department: 'Engineering', employeeNumber: 'EMP005' },
];

// Sample Workforce Codes
const sampleWorkforceCodes: WorkforceCode[] = [
  { id: 101, codeId: 1, codeTypeId: 1, prefix: 'GEN', suffix: '001', shortCodeValue: 'GEN001', longCodeValue: 'General Operations', description: 'General Operations Work', status: 1, effectiveDate: new Date('2024-01-01'), expirationDate: new Date('2026-12-31') },
  { id: 102, codeId: 2, codeTypeId: 1, prefix: 'RND', suffix: '001', shortCodeValue: 'RND001', longCodeValue: 'Research & Development', description: 'R&D Activities', status: 1, effectiveDate: new Date('2024-01-01'), expirationDate: new Date('2026-12-31') },
  { id: 103, codeId: 3, codeTypeId: 1, prefix: 'MKT', suffix: '001', shortCodeValue: 'MKT001', longCodeValue: 'Marketing', description: 'Marketing Activities', status: 1, effectiveDate: new Date('2024-01-01'), expirationDate: new Date('2026-12-31') },
  { id: 104, codeId: 4, codeTypeId: 1, prefix: 'LV', suffix: '001', shortCodeValue: 'LV001', longCodeValue: 'Paid Time Off', description: 'PTO Leave', status: 1, effectiveDate: new Date('2024-01-01'), expirationDate: new Date('2026-12-31') },
  { id: 105, codeId: 5, codeTypeId: 1, prefix: 'TRN', suffix: '001', shortCodeValue: 'TRN001', longCodeValue: 'Training & Development', description: 'Training Activities', status: 1, effectiveDate: new Date('2024-01-01'), expirationDate: new Date('2026-12-31') },
];

// Sample Account Codes
const sampleAccountCodes: WorkforceCode[] = [
  { id: 201, codeId: 1, codeTypeId: 2, prefix: 'ADM', suffix: '001', shortCodeValue: 'ADM001', longCodeValue: 'Administrative', description: 'Admin Work', status: 1, effectiveDate: new Date('2024-01-01'), expirationDate: new Date('2026-12-31') },
  { id: 202, codeId: 2, codeTypeId: 2, prefix: 'PRJ', suffix: '001', shortCodeValue: 'PRJ001', longCodeValue: 'Project Alpha', description: 'Project Alpha Work', status: 1, effectiveDate: new Date('2024-01-01'), expirationDate: new Date('2026-12-31') },
  { id: 203, codeId: 3, codeTypeId: 2, prefix: 'PRJ', suffix: '002', shortCodeValue: 'PRJ002', longCodeValue: 'Project Beta', description: 'Project Beta Work', status: 1, effectiveDate: new Date('2024-01-01'), expirationDate: new Date('2026-12-31') },
  { id: 204, codeId: 4, codeTypeId: 2, prefix: 'MNT', suffix: '001', shortCodeValue: 'MNT001', longCodeValue: 'Maintenance', description: 'Maintenance Work', status: 1, effectiveDate: new Date('2024-01-01'), expirationDate: new Date('2026-12-31') },
  { id: 205, codeId: 5, codeTypeId: 2, prefix: 'SUP', suffix: '001', shortCodeValue: 'SUP001', longCodeValue: 'Customer Support', description: 'Support Activities', status: 1, effectiveDate: new Date('2024-01-01'), expirationDate: new Date('2026-12-31') },
];

// Sample Timesheets
const sampleTimesheets: Timesheet[] = [
  {
    timesheetId: 1,
    employeeId: 1,
    employee: sampleEmployees[0],
    payPeriodId: 2,
    payPeriod: samplePayPeriods[1],
    status: 'draft',
    timesheetEntries: [
      {
        timesheetEntryId: 1,
        timesheetId: 1,
        workforceCode: sampleWorkforceCodes[0],
        accountCode: sampleAccountCodes[1],
        weeks: [
          { week: 1, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 },
          { week: 2, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 },
        ],
      },
      {
        timesheetEntryId: 2,
        timesheetId: 1,
        workforceCode: sampleWorkforceCodes[1],
        accountCode: sampleAccountCodes[2],
        weeks: [
          { week: 1, sunHours: 0, monHours: 0, tueHours: 0, wedHours: 0, thuHours: 0, friHours: 0, satHours: 0 },
          { week: 2, sunHours: 0, monHours: 0, tueHours: 0, wedHours: 4, thuHours: 4, friHours: 0, satHours: 0 },
        ],
      },
    ],
    createdAt: new Date('2026-01-19'),
  },
  {
    timesheetId: 2,
    employeeId: 2,
    employee: sampleEmployees[1],
    payPeriodId: 2,
    payPeriod: samplePayPeriods[1],
    status: 'submitted',
    timesheetEntries: [
      {
        timesheetEntryId: 3,
        timesheetId: 2,
        workforceCode: sampleWorkforceCodes[2],
        accountCode: sampleAccountCodes[0],
        weeks: [
          { week: 1, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 },
          { week: 2, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 },
        ],
      },
    ],
    submittedAt: new Date('2026-01-25'),
    createdAt: new Date('2026-01-19'),
  },
  {
    timesheetId: 3,
    employeeId: 3,
    employee: sampleEmployees[2],
    payPeriodId: 2,
    payPeriod: samplePayPeriods[1],
    status: 'approved',
    timesheetEntries: [
      {
        timesheetEntryId: 4,
        timesheetId: 3,
        workforceCode: sampleWorkforceCodes[0],
        accountCode: sampleAccountCodes[3],
        weeks: [
          { week: 1, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 },
          { week: 2, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 },
        ],
      },
    ],
    submittedAt: new Date('2026-01-24'),
    approvedAt: new Date('2026-01-26'),
    createdAt: new Date('2026-01-19'),
  },
  {
    timesheetId: 4,
    employeeId: 4,
    employee: sampleEmployees[3],
    payPeriodId: 1,
    payPeriod: samplePayPeriods[0],
    status: 'approved',
    timesheetEntries: [
      {
        timesheetEntryId: 5,
        timesheetId: 4,
        workforceCode: sampleWorkforceCodes[3],
        accountCode: sampleAccountCodes[4],
        weeks: [
          { week: 1, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 0, satHours: 0 },
          { week: 2, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 },
        ],
      },
    ],
    submittedAt: new Date('2026-01-10'),
    approvedAt: new Date('2026-01-12'),
    createdAt: new Date('2026-01-05'),
  },
  {
    timesheetId: 5,
    employeeId: 5,
    employee: sampleEmployees[4],
    payPeriodId: 2,
    payPeriod: samplePayPeriods[1],
    status: 'rejected',
    timesheetEntries: [
      {
        timesheetEntryId: 6,
        timesheetId: 5,
        workforceCode: sampleWorkforceCodes[4],
        accountCode: sampleAccountCodes[0],
        weeks: [
          { week: 1, sunHours: 0, monHours: 4, tueHours: 4, wedHours: 4, thuHours: 4, friHours: 4, satHours: 0 },
          { week: 2, sunHours: 0, monHours: 4, tueHours: 4, wedHours: 4, thuHours: 4, friHours: 4, satHours: 0 },
        ],
      },
    ],
    submittedAt: new Date('2026-01-24'),
    comments: 'Missing project code for training hours',
    createdAt: new Date('2026-01-19'),
  },
];

// ============================================================================
// Props Interfaces
// ============================================================================

interface TimesheetManagementProps {
  theme?: 'brand-a' | 'brand-a-dark';
}

// ============================================================================
// TimesheetList Component (Directory View)
// ============================================================================

const TimesheetList: React.FC<{
  timesheets: Timesheet[];
  isLoading: boolean;
  error: string | null;
  onSelectTimesheet: (timesheet: Timesheet) => void;
  onAddNew: () => void;
  onDelete: (id: number) => void;
  theme?: string;
}> = ({ timesheets, isLoading, error, onSelectTimesheet, onAddNew, onDelete, theme }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredTimesheets = useMemo(() => {
    let filtered = timesheets;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ts => ts.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ts => {
        const employeeName = ts.employee
          ? `${ts.employee.firstName} ${ts.employee.lastName}`.toLowerCase()
          : '';
        return employeeName.includes(query);
      });
    }

    return filtered;
  }, [timesheets, searchQuery, statusFilter]);

  const tableData = useMemo(() => {
    return filteredTimesheets.map(ts => ({
      timesheetId: ts.timesheetId,
      employeeName: ts.employee ? `${ts.employee.firstName} ${ts.employee.lastName}` : 'Unknown',
      payPeriodStart: ts.payPeriod ? new Date(ts.payPeriod.startDate).toLocaleDateString() : '-',
      payPeriodEnd: ts.payPeriod ? new Date(ts.payPeriod.endDate).toLocaleDateString() : '-',
      status: ts.status,
      totalHours: TimesheetService.calculateTimesheetTotal(ts),
      _original: ts,
    }));
  }, [filteredTimesheets]);

  return (
    <div data-theme={theme} className={combineClasses(commonClasses.workCodePage, themeClasses.background)}>
      <div className={commonClasses.workCodePageInner}>
        {/* Header */}
        <div className={commonClasses.workCodeHeader}>
          <h1 className={combineClasses(commonClasses.pageTitle, themeClasses.textPrimary)}>
            Timesheet Directory
          </h1>
          <Button
            onClick={onAddNew}
            className={combineClasses(
              commonClasses.primaryButton,
              themeClasses.primary,
              themeClasses.primaryHover
            )}
          >
            <Plus size={16} />
            New Timesheet
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          {/* Search */}
          <div className="flex-1">
            <Label.Root
              htmlFor="search-input"
              className={combineClasses(commonClasses.label, themeClasses.textPrimary)}
            >
              Search by Employee Name
            </Label.Root>
            <div className="relative">
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employees..."
                maxLength={100}
                className={combineClasses(
                  commonClasses.workCodeSearchInput,
                  themeClasses.background,
                  themeClasses.border,
                  themeClasses.textPrimary
                )}
              />
              <Search
                className={combineClasses(commonClasses.workCodeSearchIcon, themeClasses.textMuted)}
                size={20}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-48">
            <Label.Root className={combineClasses(commonClasses.label, themeClasses.textPrimary)}>
              Status
            </Label.Root>
            <Select.Root value={statusFilter} onValueChange={setStatusFilter}>
              <Select.Trigger
                className={combineClasses(
                  commonClasses.workCodeSelectTrigger,
                  themeClasses.background,
                  themeClasses.border,
                  themeClasses.textPrimary
                )}
              >
                <Select.Value />
                <Select.Icon>
                  <ChevronDown size={16} />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content
                  className={combineClasses(
                    commonClasses.workCodeSelectContent,
                    themeClasses.selectBackground,
                    themeClasses.border
                  )}
                >
                  <Select.Viewport className="p-1">
                    <Select.Item
                      value="all"
                      className={combineClasses(commonClasses.workCodeSelectItem, themeClasses.textPrimary)}
                    >
                      <Select.ItemText>All Statuses</Select.ItemText>
                      <Select.ItemIndicator className="ml-auto"><Check size={16} /></Select.ItemIndicator>
                    </Select.Item>
                    {TimesheetService.getStatusOptions().map(option => (
                      <Select.Item
                        key={option.value}
                        value={option.value}
                        className={combineClasses(commonClasses.workCodeSelectItem, themeClasses.textPrimary)}
                      >
                        <Select.ItemText>{option.label}</Select.ItemText>
                        <Select.ItemIndicator className="ml-auto"><Check size={16} /></Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
            {error}
          </div>
        )}

        {/* Results count */}
        <div className={combineClasses('text-sm mb-2', themeClasses.textMuted)}>
          Showing {filteredTimesheets.length} of {timesheets.length} timesheets
        </div>

        {/* Table */}
        <div className={combineClasses(
          commonClasses.workCodeTableWrapper,
          themeClasses.background,
          themeClasses.border
        )}>
          {isLoading ? (
            <div className={commonClasses.workCodeLoadingContainer}>
              <Loader2 className="animate-spin" style={{ color: 'var(--color-primary)' }} size={40} />
              <span className={combineClasses(commonClasses.workCodeLoadingText, themeClasses.textSecondary)}>
                Loading timesheets...
              </span>
            </div>
          ) : (
            <ReactTabulator
              data={tableData}
              columns={[
                {
                  title: 'Employee Name',
                  field: 'employeeName',
                  sorter: 'string',
                  headerFilter: 'input',
                },
                {
                  title: 'Pay Period Start',
                  field: 'payPeriodStart',
                  sorter: 'date',
                },
                {
                  title: 'Pay Period End',
                  field: 'payPeriodEnd',
                  sorter: 'date',
                },
                {
                  title: 'Status',
                  field: 'status',
                  sorter: 'string',
                  formatter: (cell: any) => {
                    const status = cell.getValue() as TimesheetStatus;
                    const colorClass = TimesheetService.getStatusColor(status);
                    return `<span class="px-2 py-1 text-xs font-medium rounded-full ${colorClass}">${TimesheetService.getStatusLabel(status)}</span>`;
                  },
                },
                {
                  title: 'Total Hours',
                  field: 'totalHours',
                  sorter: 'number',
                  hozAlign: 'right',
                },
                {
                  title: 'Actions',
                  field: 'actions',
                  hozAlign: 'center',
                  headerSort: false,
                  width: 180,
                  formatter: (cell: any) => {
                    const data = cell.getRow().getData();
                    return `
                      <div style="display: flex; gap: 8px; justify-content: center;">
                        <button class="edit-btn px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600" data-id="${data.timesheetId}">Edit</button>
                        <button class="delete-btn px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600" data-id="${data.timesheetId}">Delete</button>
                      </div>
                    `;
                  },
                },
              ]}
              options={{
                layout: 'fitData',
                pagination: true,
                paginationSize: 10,
                height: '500px',
              }}
              events={{
                cellClick: (e: any, cell: any) => {
                  const target = e.target as HTMLElement;
                  const editBtn = target.closest('.edit-btn');
                  const deleteBtn = target.closest('.delete-btn');

                  if (editBtn) {
                    const rowData = cell.getRow().getData();
                    onSelectTimesheet(rowData._original);
                  } else if (deleteBtn) {
                    const id = deleteBtn.getAttribute('data-id');
                    if (id && confirm('Are you sure you want to delete this timesheet?')) {
                      onDelete(parseInt(id));
                    }
                  }
                },
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TimesheetEdit Component (Edit View)
// ============================================================================

const TimesheetEdit: React.FC<{
  timesheet: Timesheet | null;
  payPeriods: PayPeriod[];
  employees: Employee[];
  workforceCodes: WorkforceCode[];
  accountCodes: WorkforceCode[];
  onSave: (timesheet: Timesheet) => Promise<void>;
  onCancel: () => void;
  isNew: boolean;
  theme?: string;
}> = ({
  timesheet,
  payPeriods,
  employees,
  workforceCodes,
  accountCodes,
  onSave,
  onCancel,
  isNew,
  theme
}) => {
  // Find current pay period (for new timesheets)
  const currentPayPeriod = useMemo(() => {
    const today = new Date();
    return payPeriods.find(pp => {
      const start = new Date(pp.startDate);
      const end = new Date(pp.endDate);
      return today >= start && today <= end;
    }) || payPeriods[0];
  }, [payPeriods]);

  const [formData, setFormData] = useState<Timesheet>(() => {
    if (timesheet) {
      return { ...timesheet };
    }
    // New timesheet defaults
    return {
      timesheetId: 0,
      employeeId: employees[0]?.employeeId || 0,
      employee: employees[0],
      payPeriodId: currentPayPeriod?.payPeriodId || 0,
      payPeriod: currentPayPeriod,
      status: 'draft' as TimesheetStatus,
      timesheetEntries: [],
    };
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEdit = TimesheetService.canEdit(formData);
  const canSubmit = TimesheetService.canSubmit(formData);

  const handlePayPeriodChange = (payPeriodId: string) => {
    const selectedPayPeriod = payPeriods.find(pp => pp.payPeriodId === parseInt(payPeriodId));
    setFormData(prev => ({
      ...prev,
      payPeriodId: parseInt(payPeriodId),
      payPeriod: selectedPayPeriod,
    }));
  };

  const handleEmployeeChange = (employeeId: string) => {
    const selectedEmployee = employees.find(emp => emp.employeeId === parseInt(employeeId));
    setFormData(prev => ({
      ...prev,
      employeeId: parseInt(employeeId),
      employee: selectedEmployee,
    }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await onSave(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to save timesheet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const submittedTimesheet = { ...formData, status: 'submitted' as TimesheetStatus };
      await onSave(submittedTimesheet);
    } catch (err: any) {
      setError(err.message || 'Failed to submit timesheet');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div data-theme={theme} className={combineClasses(commonClasses.workCodePage, themeClasses.background)}>
      <div className={commonClasses.workCodePageInner}>
        {/* Header */}
        <div className={commonClasses.workCodeFormHeader}>
          <Button
            onClick={onCancel}
            className={combineClasses(commonClasses.workCodeBackButton, themeClasses.textPrimary)}
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </Button>
          <h1 className={combineClasses(commonClasses.workCodeFormTitle, themeClasses.textPrimary)}>
            {isNew ? 'Create New Timesheet' : 'Edit Timesheet'}
          </h1>
        </div>

        {/* Status Badge */}
        <div className="mb-4">
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${TimesheetService.getStatusColor(formData.status)}`}>
            {TimesheetService.getStatusLabel(formData.status)}
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
            {error}
          </div>
        )}

        {/* Form */}
        <div className={combineClasses(
          commonClasses.workCodeFormContainer,
          themeClasses.background
        )}>
          {/* Timesheet Header Info */}
          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            {/* Employee */}
            <div>
              <Label.Root className={combineClasses(commonClasses.workCodeFieldLabel, themeClasses.textSecondary)}>
                Employee
              </Label.Root>
              {isNew ? (
                <Select.Root
                  value={formData.employeeId.toString()}
                  onValueChange={handleEmployeeChange}
                >
                  <Select.Trigger
                    className={combineClasses(
                      commonClasses.workCodeSelectTrigger,
                      themeClasses.background,
                      themeClasses.border,
                      themeClasses.textPrimary
                    )}
                  >
                    <Select.Value />
                    <Select.Icon><ChevronDown size={16} /></Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className={combineClasses(
                      commonClasses.workCodeSelectContent,
                      themeClasses.selectBackground,
                      themeClasses.border
                    )}>
                      <Select.Viewport className="p-1">
                        {employees.map(emp => (
                          <Select.Item
                            key={emp.employeeId}
                            value={emp.employeeId.toString()}
                            className={combineClasses(commonClasses.workCodeSelectItem, themeClasses.textPrimary)}
                          >
                            <Select.ItemText>{emp.firstName} {emp.lastName}</Select.ItemText>
                            <Select.ItemIndicator className="ml-auto"><Check size={16} /></Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              ) : (
                <div className={combineClasses('text-lg font-medium', themeClasses.textPrimary)}>
                  {formData.employee ? `${formData.employee.firstName} ${formData.employee.lastName}` : 'Unknown'}
                </div>
              )}
            </div>

            {/* Pay Period */}
            <div>
              <Label.Root className={combineClasses(commonClasses.workCodeFieldLabel, themeClasses.textSecondary)}>
                Pay Period
              </Label.Root>
              <Select.Root
                value={formData.payPeriodId.toString()}
                onValueChange={handlePayPeriodChange}
                disabled={!canEdit}
              >
                <Select.Trigger
                  className={combineClasses(
                    commonClasses.workCodeSelectTrigger,
                    !canEdit ? themeClasses.surface : themeClasses.background,
                    themeClasses.border,
                    themeClasses.textPrimary
                  )}
                  disabled={!canEdit}
                >
                  <Select.Value>
                    {formData.payPeriod ? TimesheetService.formatPayPeriod(formData.payPeriod) : 'Select Pay Period'}
                  </Select.Value>
                  <Select.Icon><ChevronDown size={16} /></Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className={combineClasses(
                    commonClasses.workCodeSelectContent,
                    themeClasses.selectBackground,
                    themeClasses.border
                  )}>
                    <Select.Viewport className="p-1">
                      {payPeriods.map(pp => (
                        <Select.Item
                          key={pp.payPeriodId}
                          value={pp.payPeriodId.toString()}
                          className={combineClasses(commonClasses.workCodeSelectItem, themeClasses.textPrimary)}
                        >
                          <Select.ItemText>{TimesheetService.formatPayPeriod(pp)}</Select.ItemText>
                          <Select.ItemIndicator className="ml-auto"><Check size={16} /></Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
          </div>

          {/* Timesheet Entries Table */}
          <div className="mb-6">
            <MantineProvider >
            <MantineReactTimeSheetTable
              availableAccountCodes={accountCodes}
              availableWorkforceCodes={workforceCodes}
              initialData={formData.timesheetEntries}
            />
            </MantineProvider>
          </div>

          {/* Footer Actions */}
          <div className={combineClasses(
            commonClasses.workCodeFormFooter,
            themeClasses.surface
          )}>
            <Button
              onClick={onCancel}
              disabled={isSubmitting}
              className={combineClasses(
                commonClasses.workCodeCancelButton,
                themeClasses.background,
                themeClasses.border,
                themeClasses.textPrimary
              )}
            >
              Cancel
            </Button>

            {canEdit && (
              <Button
                onClick={handleSave}
                disabled={isSubmitting}
                className={combineClasses(
                  commonClasses.secondaryButton,
                  themeClasses.background,
                  themeClasses.border,
                  themeClasses.textPrimary
                )}
              >
                {isSubmitting && <Loader2 className="animate-spin mr-2" size={16} />}
                Save Draft
              </Button>
            )}

            {canSubmit && (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={combineClasses(
                  commonClasses.workCodeSaveButton,
                  themeClasses.primary,
                  themeClasses.primaryHover
                )}
              >
                {isSubmitting && <Loader2 className="animate-spin mr-2" size={16} />}
                Submit for Approval
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main TimesheetManagement Component (Container)
// ============================================================================

const TimesheetManagement: React.FC<TimesheetManagementProps> = ({
  theme = 'brand-a'
}) => {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>(samplePayPeriods);
  const [employees] = useState<Employee[]>(sampleEmployees);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<'list' | 'edit'>('list');
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null);

  // Fetch timesheets on mount
  useEffect(() => {
    fetchTimesheets();
    fetchPayPeriods();
  }, []);

  const fetchTimesheets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await timesheetService.getAllTimesheets();
      if (response.success && response.data) {
        setTimesheets(response.data);
      } else {
        // Fallback to sample data if API fails
        setTimesheets(sampleTimesheets);
        console.warn('Using sample data:', response.message);
      }
    } catch (err) {
      // Fallback to sample data on error
      setTimesheets(sampleTimesheets);
      console.error('Error fetching timesheets, using sample data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPayPeriods = async () => {
    try {
      const response = await timesheetService.getPayPeriods();
      if (response.success && response.data) {
        setPayPeriods(response.data);
      }
    } catch (err) {
      console.error('Error fetching pay periods, using sample data:', err);
    }
  };

  const handleSelectTimesheet = (timesheet: Timesheet) => {
    setSelectedTimesheet(timesheet);
    setCurrentPage('edit');
  };

  const handleAddNew = () => {
    setSelectedTimesheet(null);
    setCurrentPage('edit');
  };

  const handleSave = async (timesheet: Timesheet) => {
    try {
      if (selectedTimesheet) {
        // Update existing timesheet
        const response = await timesheetService.updateTimesheet(selectedTimesheet.timesheetId, {
          timesheetEntries: timesheet.timesheetEntries,
          status: timesheet.status,
          comments: timesheet.comments,
        });

        if (response.success && response.data) {
          setTimesheets(prev => prev.map(ts =>
            ts.timesheetId === selectedTimesheet.timesheetId ? response.data! : ts
          ));
        } else {
          throw new Error(response.message || 'Update failed');
        }
      } else {
        // Create new timesheet
        const response = await timesheetService.createTimesheet({
          employeeId: timesheet.employeeId,
          payPeriodId: timesheet.payPeriodId,
          timesheetEntries: timesheet.timesheetEntries,
          comments: timesheet.comments,
        });

        if (response.success && response.data) {
          setTimesheets(prev => [...prev, response.data!]);
        } else {
          throw new Error(response.message || 'Create failed');
        }
      }

      setCurrentPage('list');
      setSelectedTimesheet(null);
    } catch (err) {
      throw err; // Let the form handle the error display
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await timesheetService.deleteTimesheet(id);
      if (response.success) {
        setTimesheets(prev => prev.filter(ts => ts.timesheetId !== id));
      } else {
        throw new Error(response.message || 'Delete failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Error deleting timesheet:', err);
    }
  };

  const handleCancel = () => {
    setCurrentPage('list');
    setSelectedTimesheet(null);
  };

  return currentPage === 'list' ? (
    <TimesheetList
      timesheets={timesheets}
      isLoading={isLoading}
      error={error}
      onSelectTimesheet={handleSelectTimesheet}
      onAddNew={handleAddNew}
      onDelete={handleDelete}
      theme={theme}
    />
  ) : (
    <TimesheetEdit
      timesheet={selectedTimesheet}
      payPeriods={payPeriods}
      employees={employees}
      workforceCodes={sampleWorkforceCodes}
      accountCodes={sampleAccountCodes}
      onSave={handleSave}
      onCancel={handleCancel}
      isNew={!selectedTimesheet}
      theme={theme}
    />
  );
};

export default TimesheetManagement;
