// src/pages/TimesheetManagement.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  MantineReactTable,
  useMantineReactTable,
  type MRT_ColumnDef,
} from 'mantine-react-table';
import { Box, MantineProvider } from '@mantine/core';
import * as Select from '@radix-ui/react-select';
import * as Label from '@radix-ui/react-label';
import { Button } from "@radix-ui/themes";
import { ArrowLeft, Plus, Loader2, Check, ChevronDown, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import 'mantine-react-table/styles.css';
import '../themes/brand-a.css';
import '../index.css';

// Import centralized styles
import { commonClasses, themeClasses, combineClasses } from '../styles/styles.classes.ts';

// Import services
import { TimesheetService } from '../services/timesheet.service.ts';
import { EmployeeService } from '../services/employee.service.ts';
import { WorkCodeService } from '../services/work-codes.service.ts';
import { HttpClient } from '../services/common.services.ts';

// Import types
import {
  Timesheet,
  TimesheetEntry,
  TimesheetSummary,
  TimesheetStatus,
  PayPeriod,  
  Weeks,
} from '../types/timesheet.types.ts';
import { WorkforceCode } from '../types/workcode.types.ts';
import { Employee } from '../types/employee.types.ts'

// Import MantineReactTimeSheetTable
import MantineReactTimeSheetTable from '../components/MantineReactTimeSheetTable';

// Initialize services
const httpClient = new HttpClient({ baseURL: 'http://localhost:1110/api/v1' });
const timesheetService = new TimesheetService(httpClient);
const workCodeService = new WorkCodeService(httpClient);

//const employeeHttpClient = new HttpClient({ baseURL: 'http://localhost:1110/api/v1' });
const employeeService = new EmployeeService(httpClient);


// ============================================================================
// Props Interfaces
// ============================================================================

interface TimesheetManagementProps {
  theme?: 'brand-a' | 'brand-a-dark';
}

// ============================================================================
// Table row type for directory view
// ============================================================================

interface TimesheetTableRow {
  timesheetId: number;
  employeeName: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  status: TimesheetStatus;
  totalHours: number;
  _original: TimesheetSummary;
}

// ============================================================================
// TimesheetList Component (Directory View)
// ============================================================================

const TimesheetList: React.FC<{
  timesheets: TimesheetSummary[];
  isLoading: boolean;
  error: string | null;
  onSelectTimesheet: (summary: TimesheetSummary) => void;
  onAddNew: () => void;
  onRefresh: () => void;
  onDelete: (id: number) => void;
  theme?: string;
}> = ({ timesheets, isLoading, error, onSelectTimesheet, onAddNew, onRefresh, onDelete, theme }) => {

  const tableData = useMemo<TimesheetTableRow[]>(() => {
    return timesheets.map(ts => ({
      timesheetId: ts.timesheetId,
      employeeName: ts.employeeName || 'Unknown',
      payPeriodStart: ts.payPeriodStartDate ? new Date(ts.payPeriodStartDate).toLocaleDateString() : '-',
      payPeriodEnd: ts.payPeriodEndDate ? new Date(ts.payPeriodEndDate).toLocaleDateString() : '-',
      status: ts.status,
      totalHours: ts.totalHours ?? 0,
      _original: ts,
    }));
  }, [timesheets]);

  const columns = useMemo<MRT_ColumnDef<TimesheetTableRow>[]>(() => [
    {
      accessorKey: 'employeeName',
      header: 'Employee Name',
      size: 200,
    },
    {
      accessorKey: 'payPeriodStart',
      header: 'Pay Period Start',
      size: 150,
      enableColumnFilter: false,
    },
    {
      accessorKey: 'payPeriodEnd',
      header: 'Pay Period End',
      size: 150,
      enableColumnFilter: false,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 130,
      Cell: ({ cell }) => {
        const status = cell.getValue<TimesheetStatus>();
        const colorClass = TimesheetService.getStatusColor(status);
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
            {TimesheetService.getStatusLabel(status)}
          </span>
        );
      },
      filterVariant: 'select',
      mantineFilterSelectProps: {
        data: TimesheetService.getStatusOptions().map(o => ({
          value: o.value,
          label: o.label,
        })),
      },
    },
    {
      accessorKey: 'totalHours',
      header: 'Total Hours',
      size: 120,
      enableColumnFilter: false,
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 180,
      enableColumnFilter: false,
      enableSorting: false,
      Cell: ({ row }) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectTimesheet(row.original._original);
            }}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <Pencil size={14} /> Edit
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Are you sure you want to delete this timesheet?')) {
                onDelete(row.original.timesheetId);
              }
            }}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      ),
    },
  ], [onSelectTimesheet, onDelete]);

  const table = useMantineReactTable({
    columns,
    data: tableData,
    enableColumnFilters: true,
    enableColumnFilterModes: false,
    enableGlobalFilter: true,
    enableSorting: true,
    enablePagination: true,
    enableEditing: false,
    enableRowSelection: false,
    enableRowActions: false,
    enableColumnOrdering: true,
    enableFullScreenToggle: false,
    enableDensityToggle: true,
    enableStickyHeader: true,
    enablePinning: false,
    enableColumnResizing: true,
    layoutMode: 'semantic',
    initialState: {
      density: 'xs',
      showGlobalFilter: true,
      pagination: { pageSize: 10, pageIndex: 0 },
      sorting: [{ id: 'employeeName', desc: false }],
    },
    paginationDisplayMode: 'pages',
    state: {
      isLoading,
      showAlertBanner: !!error,
    },
    mantineToolbarAlertBannerProps: error
      ? { color: 'red', children: error }
      : undefined,
    mantineTableProps: {
      striped: true,
      withTableBorder: true,
      withColumnBorders: true,
    },
    mantineTableHeadCellProps: {
      align: 'center',
    },
    mantineTableBodyCellProps: {
      align: 'center',
    },
    mantineTableBodyRowProps: ({ row }) => ({
      onClick: () => onSelectTimesheet(row.original._original),
      style: { cursor: 'pointer' },
    }),
    renderTopToolbarCustomActions: () => (
      <Box style={{ display: 'flex', gap: '16px', padding: '8px' }}>
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
        <Button
          onClick={onRefresh}
          className={combineClasses(
            commonClasses.secondaryButton,
            themeClasses.background,
            themeClasses.border,
            themeClasses.textPrimary
          )}
          style={{ cursor: 'pointer' }}
        >
          <RefreshCw size={16} />
          Refresh
        </Button>
      </Box>
    ),
  });

  return (
    <div data-theme={theme} className={combineClasses(commonClasses.workCodePage, themeClasses.background)}>
      <div className={commonClasses.workCodePageInner}>
        {/* Header */}
        <div className={commonClasses.workCodeHeader}>
          <h1 className={combineClasses(commonClasses.pageTitle, themeClasses.textPrimary)}>
            Timesheet Directory
          </h1>
        </div>

        {/* Table */}
        <div className={combineClasses(
          commonClasses.workCodeTableWrapper,
          themeClasses.background,
          themeClasses.border
        )}>
          <MantineReactTable table={table} />
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
              onChange={(entries) => setFormData(prev => ({ ...prev, timesheetEntries: entries }))}
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
  const [timesheets, setTimesheets] = useState<TimesheetSummary[]>([]);
  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workforceCodes, setWorkforceCodes] = useState<WorkforceCode[]>([]);
  const [accountCodes, setAccountCodes] = useState<WorkforceCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<'list' | 'edit'>('list');
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null);

  // Fetch data on mount
  useEffect(() => {
    fetchTimesheets();
    fetchPayPeriods();
    fetchEmployees();
    fetchWorkforceCodes();
    fetchAccountCodes();
  }, []);

  const fetchTimesheets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await timesheetService.getTimesheetSummaries();
      if (response.success && response.data) {
        setTimesheets(response.data);
      } else {
        console.warn('Failed to fetch timesheets:', response.message);
      }
    } catch (err) {
      console.error('Error fetching timesheets:', err);
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
      console.error('Error fetching pay periods:', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getAllEmployees();
      if (response.success && response.data) {
        setEmployees(response.data);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchWorkforceCodes = async () => {
    try {
      const response = await workCodeService.getWorkCodesByTypeName('WORK_CODE');
      if (response.success && response.data) {
        setWorkforceCodes(response.data);
      }
    } catch (err) {
      console.error('Error fetching workforce codes:', err);
    }
  };

  const fetchAccountCodes = async () => {
    try {
      const response = await workCodeService.getWorkCodesByTypeName('ACCOUNT_CODE');
      if (response.success && response.data) {
        setAccountCodes(response.data);
      }
    } catch (err) {
      console.error('Error fetching account codes:', err);
    }
  };

  const handleSelectTimesheet = async (summary: TimesheetSummary) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await timesheetService.getTimesheetById(summary.timesheetId);
      if (response.success && response.data) {
        setSelectedTimesheet(response.data);
        setCurrentPage('edit');
      } else {
        setError(response.message || 'Failed to load timesheet details');
      }
    } catch (err) {
      console.error('Error fetching timesheet details:', err);
      setError('Failed to load timesheet details');
    } finally {
      setIsLoading(false);
    }
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
          // setTimesheets(prev => prev.map(ts =>
          //   ts.timesheetId === selectedTimesheet.timesheetId ? response.data! : ts
          // ));
          fetchTimesheets(); // Refresh the list to show the updated timesheet
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
          //setTimesheets(prev => [...prev, response.data!]);
          fetchTimesheets(); // Refresh the list to show the new timesheet
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
    <MantineProvider>
      <TimesheetList
        timesheets={timesheets}
        isLoading={isLoading}
        error={error}
        onSelectTimesheet={handleSelectTimesheet}
        onAddNew={handleAddNew}
        onRefresh={fetchTimesheets}
        onDelete={handleDelete}
        theme={theme}
      />
    </MantineProvider>
  ) : (
    <TimesheetEdit
      timesheet={selectedTimesheet}
      payPeriods={payPeriods}
      employees={employees}
      workforceCodes={workforceCodes}
      accountCodes={accountCodes}
      onSave={handleSave}
      onCancel={handleCancel}
      isNew={!selectedTimesheet}
      theme={theme}
    />
  );
};

export default TimesheetManagement;
