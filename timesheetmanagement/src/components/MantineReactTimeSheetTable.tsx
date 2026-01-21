import { useMemo, useState } from 'react';
import {
  MantineReactTable,
  useMantineReactTable,
  createRow,
  type MRT_ColumnDef,
  type MRT_TableOptions,
  type MRT_Column,
} from 'mantine-react-table';
import { Box, Text, ActionIcon, Button, Anchor, Center } from '@mantine/core';
import WorkforceCodeModal from './WorkCodeModal';
import { useDisclosure } from '@mantine/hooks';
import { IconEdit, IconSend, IconTrash } from '@tabler/icons-react';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import 'mantine-react-table/styles.css';
import '../styles/App.css';
import React from "react";
import { WorkforceCode } from '@/types/workcode.types';

// Types
interface CustomColumnMeta extends MRT_Column<TimesheetEntry> {
  weekIndex?: number;
  dayKey?: keyof Weeks;
}

interface Weeks {
  week: number;
  sunHours: number;
  monHours: number;
  tueHours: number;
  wedHours: number;
  thuHours: number;
  friHours: number;
  satHours: number;
}

export interface TimesheetEntry {
  timesheetEntryId?: number;
  timesheetId?: number;
  payperiodId?: number;
  workforceCode?: WorkforceCode;
  accountCode?: WorkforceCode;
  weeks: Weeks[];
}

// Calculate total hours for a single week
function calculateWeekTotal(week: Weeks): number {
  return (
    week.sunHours +
    week.monHours +
    week.tueHours +
    week.wedHours +
    week.thuHours +
    week.friHours +
    week.satHours
  );
}

// Calculate total hours for a timesheet entry row (sum of all weeks)
function calculateRowTotal(entry: TimesheetEntry): number {
  return entry.weeks.reduce((total, week) => total + calculateWeekTotal(week), 0);
}

// Sample workforce codes for selection - Work Codes
const availableWorkCodes: WorkforceCode[] = [
  { work_code_id: 101, prefix: 'GEN', suffix: '001', shortWorkforceCode: 'GEN001', longWorkforceCode: 'General Operations', description: 'General Operations Work', status: 1, effectiveDate: new Date('2024-01-01'), expirationDate: new Date('2025-12-31'), codeType: 'workCode' },
  { work_code_id: 102, prefix: 'RND', suffix: '001', shortWorkforceCode: 'RND001', longWorkforceCode: 'Research & Development', description: 'R&D Activities', status: 1, effectiveDate: new Date('2024-01-01'), expirationDate: new Date('2025-12-31'), codeType: 'workCode' },
  { work_code_id: 103, prefix: 'MKT', suffix: '001', shortWorkforceCode: 'MKT001', longWorkforceCode: 'Marketing', description: 'Marketing Activities', status: 1, effectiveDate: new Date('2024-01-01'), expirationDate: new Date('2025-12-31'), codeType: 'workCode' },
  { work_code_id: 104, prefix: 'LV', suffix: '001', shortWorkforceCode: 'LV001', longWorkforceCode: 'Paid Time Off', description: 'PTO Leave', status: 1, effectiveDate: new Date('2024-01-01'), expirationDate: new Date('2025-12-31'), codeType: 'workCode' },
  { work_code_id: 105, prefix: 'TRN', suffix: '001', shortWorkforceCode: 'TRN001', longWorkforceCode: 'Training & Development', description: 'Training Activities', status: 1, effectiveDate: new Date('2024-01-01'), expirationDate: new Date('2025-12-31'), codeType: 'workCode' },
];

// Sample workforce codes for selection - Account Codes
const availableAccountCodes: WorkforceCode[] = [
  { work_code_id: 201, prefix: 'ADM', suffix: '001', shortWorkforceCode: 'ADM001', longWorkforceCode: 'Administrative', description: 'Admin Work', status: 1, effectiveDate: new Date('2024-01-01'), expirationDate: new Date('2025-12-31'), codeType: 'accountCode' },
  { work_code_id: 202, prefix: 'PRJ', suffix: '001', shortWorkforceCode: 'PRJ001', longWorkforceCode: 'Project Alpha', description: 'Project Alpha Work', status: 1, effectiveDate: new Date('2024-01-01'), expirationDate: new Date('2025-12-31'), codeType: 'accountCode' },
  { work_code_id: 203, prefix: 'PRJ', suffix: '002', shortWorkforceCode: 'PRJ002', longWorkforceCode: 'Project Beta', description: 'Project Beta Work', status: 1, effectiveDate: new Date('2024-01-01'), expirationDate: new Date('2025-12-31'), codeType: 'accountCode' },
  { work_code_id: 204, prefix: 'MNT', suffix: '001', shortWorkforceCode: 'MNT001', longWorkforceCode: 'Maintenance', description: 'Maintenance Work', status: 0, effectiveDate: new Date('2023-01-01'), expirationDate: new Date('2024-06-30'), codeType: 'accountCode' },
  { work_code_id: 205, prefix: 'SUP', suffix: '001', shortWorkforceCode: 'SUP001', longWorkforceCode: 'Customer Support', description: 'Support Activities', status: 1, effectiveDate: new Date('2024-01-01'), expirationDate: new Date('2026-12-31'), codeType: 'accountCode' },
];





// Sample timesheet data
const initialData: TimesheetEntry[] = [
  {
    timesheetEntryId: 1,
    timesheetId: 100,
    payperiodId: 1,
    workforceCode: availableWorkCodes[0], // GEN001
    accountCode: availableAccountCodes[1], // RND001
    weeks: [
      { week: 1, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 },
      { week: 2, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 },
    ],
  },
  {
    timesheetEntryId: 2,
    timesheetId: 100,
    payperiodId: 1,
    workforceCode: availableWorkCodes[1], // RND001
    accountCode: availableAccountCodes[2], // MKT001
    weeks: [
      { week: 1, sunHours: 0, monHours: 7, tueHours: 7, wedHours: 7, thuHours: 7, friHours: 7, satHours: 0 },
      { week: 2, sunHours: 0, monHours: 6, tueHours: 6, wedHours: 6, thuHours: 6, friHours: 6, satHours: 0 },
    ],
  },
  {
    timesheetEntryId: 3,
    timesheetId: 100,
    payperiodId: 1,
    workforceCode: availableWorkCodes[2], // MKT001
    accountCode: availableAccountCodes[0], // ADM001
    weeks: [
      { week: 1, sunHours: 4, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 4 },
      { week: 2, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 4, satHours: 0 },
    ],
  },
  {
    timesheetEntryId: 4,
    timesheetId: 100,
    payperiodId: 1,
    workforceCode: availableWorkCodes[3], // LV001 (PTO)
    accountCode: availableAccountCodes[3], // LV001
    weeks: [
      { week: 1, sunHours: 0, monHours: 0, tueHours: 0, wedHours: 0, thuHours: 0, friHours: 8, satHours: 0 },
      { week: 2, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 0, thuHours: 0, friHours: 0, satHours: 0 },
    ],
  },
  {
    timesheetEntryId: 5,
    timesheetId: 100,
    payperiodId: 1,
    workforceCode: availableWorkCodes[4], // TRN001 (Training)
    accountCode: availableAccountCodes[4], // SUP001
    weeks: [
      { week: 1, sunHours: 0, monHours: 4, tueHours: 4, wedHours: 4, thuHours: 4, friHours: 4, satHours: 0 },
      { week: 2, sunHours: 0, monHours: 0, tueHours: 0, wedHours: 4, thuHours: 4, friHours: 4, satHours: 0 },
    ],
  },
];

const MantineReactTimeSheetTable = () => {
  const [data, setData] = useState<TimesheetEntry[]>(initialData);
  const [workforceCodeModalOpened, { open: openWorkforceCodeModal, close: closeWorkforceCodeModal }] = useDisclosure(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [creatingRowData, setCreatingRowData] = useState<TimesheetEntry | null>(null);
  const [isCreatingRow, setIsCreatingRow] = useState(false);
  const [availableWorkforceCode, setAvailableWorkforceCode] = useState<WorkforceCode[]>([]);
  const [modalTitle, setModalTitle] = useState<string>('');

  // Handle workforce code selection
  const handleWorkforceCodeSelect = (workforceCode: WorkforceCode) => {
    if (isCreatingRow && creatingRowData) {
      // For creating rows, update via state to trigger re-render
      const updatedEntry = { ...creatingRowData };
      if (workforceCode.codeType === 'accountCode') {
        updatedEntry.accountCode = workforceCode;
      } else {
        updatedEntry.workforceCode = workforceCode;
      }
      setCreatingRowData(updatedEntry);
    } else if (selectedRowIndex !== null) {
      // For existing rows, update the data state
      setData((prev) => {
        const newData = [...prev];
        const entry = { ...newData[selectedRowIndex] };
        if (workforceCode.codeType === 'accountCode') {
          entry.accountCode = workforceCode;
        } else {
          entry.workforceCode = workforceCode;
        }
        newData[selectedRowIndex] = entry;
        return newData;
      });
    }
    closeWorkforceCodeModal();
    setIsCreatingRow(false);
  };

  // Handler for cell edits using built-in editing
  const handleSaveCell: MRT_TableOptions<TimesheetEntry>['mantineEditTextInputProps'] = ({
    cell,
    row,
    column,
  }) => {
    return {
      type: 'number',
      style: { width: 60 },
      onBlur: (event) => {
        const meta = column.columnDef.meta as CustomColumnMeta;
        const weekIndex = meta?.weekIndex as number;
        const dayKey = meta?.dayKey as keyof Weeks;
        const value = parseFloat(event.currentTarget.value) || 0;

        // Skip if this is a creating row (not yet in data array)
        // The creating row will be saved via onCreatingRowSave
        if (row.index < 0 || row.index >= data.length) {
          // Update the row.original directly for creating rows
          if (row.original?.weeks && weekIndex !== undefined && dayKey) {
            row.original.weeks[weekIndex][dayKey] = value;
          }
          return;
        }

        if (weekIndex !== undefined && dayKey) {
          setData((prev) => {
            const newData = [...prev];
            const entry = newData[row.index];
            if (!entry?.weeks) return prev;

            const weeks = [...entry.weeks];
            weeks[weekIndex] = { ...weeks[weekIndex], [dayKey]: value };
            newData[row.index] = { ...entry, weeks };
            return newData;
          });
        }
      },
    };
  };

  const columns = useMemo<MRT_ColumnDef<TimesheetEntry, CustomColumnMeta>[]>(() => {
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayKeys: (keyof Weeks)[] = [
      'sunHours',
      'monHours',
      'tueHours',
      'wedHours',
      'thuHours',
      'friHours',
      'satHours',
    ];

    const cols: MRT_ColumnDef<TimesheetEntry, CustomColumnMeta>[] = [
      // Code columns
      {
        id: 'codes',
        header: 'Codes',
        columns: [
          {
            id: 'workCode',
            header: 'Work Code',
            size: 120,
            accessorFn: (row) => row.workforceCode?.shortWorkforceCode ?? '',
            enableEditing: false,
            grow: false,
            Cell: ({ row }) => {
              const isCreating    = row.index < 0 || row.index >= data.length;
              const displayData   = isCreating && creatingRowData ? creatingRowData : row.original;
              const displayValue  = displayData?.workforceCode?.shortWorkforceCode ?? '';
              const workforceCode = displayData?.workforceCode;

              // Check if work code is inactive or will expire within 5 days
              const isInactive = workforceCode?.status === 0;
              const isExpiringSoon = (() => {
                if (!workforceCode?.expirationDate) return false;
                const expirationDate = new Date(workforceCode.expirationDate);
                const today = new Date();
                const fiveDaysFromNow = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
                return expirationDate <= fiveDaysFromNow;
              })();
              const shouldBlink = isInactive || isExpiringSoon;

              const handleOpenModal = () => {
                if (isCreating) {
                  setIsCreatingRow(true);
                  // Initialize creatingRowData with current row.original if not already set
                  if (!creatingRowData) {
                    setCreatingRowData(row.original);
                  }
                  setSelectedRowIndex(null);
                } else {
                  setIsCreatingRow(false);
                  setCreatingRowData(null);
                  setSelectedRowIndex(row.index);
                }
                setModalTitle('Select Work Code');
                setAvailableWorkforceCode(availableWorkCodes);
                openWorkforceCodeModal();
              };

              return (
                <Box
                  className={shouldBlink ? 'work-code-warning' : undefined}
                  style={{
                    fontWeight: 'bold',
                    backgroundColor: shouldBlink ? undefined : '#f3e5f5',
                    padding: '4px 8px',
                    borderRadius: 4,
                  }}
                >
                  <Anchor onClick={handleOpenModal}>
                    {displayValue || (isCreating ? 'Select...' : '')}
                  </Anchor>
                  <Button onClick={handleOpenModal}>Select Work Code</Button>
                </Box>
              ) as React.ReactNode;
            },
          },
          {
            id: 'accountCode',
            header: 'Account Code',
            size: 130,
            accessorFn: (row) => row.accountCode?.shortWorkforceCode ?? '',
            enableEditing: false,
            grow: false,
            Cell: ({ row }) => {
              const isCreating = row.index < 0 || row.index >= data.length;
              // Use creatingRowData if available for display, otherwise use row.original
              const displayData = isCreating && creatingRowData ? creatingRowData : row.original;
              const displayValue = displayData?.accountCode?.shortWorkforceCode ?? '';
              const accountCode = displayData?.accountCode;

              // Check if account code is inactive or will expire within 5 days
              const isInactive = accountCode?.status === 0;
              const isExpiringSoon = (() => {
                if (!accountCode?.expirationDate) return false;
                const expirationDate = new Date(accountCode.expirationDate);
                const today = new Date();
                const fiveDaysFromNow = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
                return expirationDate <= fiveDaysFromNow;
              })();
              const shouldBlink = isInactive || isExpiringSoon;

              const handleOpenModal = () => {
                if (isCreating) {
                  setIsCreatingRow(true);
                  // Initialize creatingRowData with current row.original if not already set
                  if (!creatingRowData) {
                    setCreatingRowData(row.original);
                  }
                  setSelectedRowIndex(null);
                } else {
                  setIsCreatingRow(false);
                  setCreatingRowData(null);
                  setSelectedRowIndex(row.index);
                }
                setModalTitle('Select Account Code');
                setAvailableWorkforceCode(availableAccountCodes);
                openWorkforceCodeModal();
              };

              return (
                <Box
                  className={shouldBlink ? 'work-code-warning' : undefined}
                  style={{
                    fontWeight: 'bold',
                    backgroundColor: shouldBlink ? undefined : '#f3e5f5',
                    padding: '4px 8px',
                    borderRadius: 4,
                  }}
                >
                  <Anchor onClick={handleOpenModal}>
                    {displayValue || (isCreating ? 'Select...' : '')}
                  </Anchor>
                  <Button size="xs" onClick={handleOpenModal}>
                    Select Account
                  </Button>
                </Box>
              ) as React.ReactNode;
            },
          },  
        ],
      },
    ];

    // Generate week columns dynamically
    const numWeeks = data[0]?.weeks.length ?? 2;

    for (let weekIdx = 0; weekIdx < numWeeks; weekIdx++) {
      const weekNumber = weekIdx + 1;
      const weekColumns: MRT_ColumnDef<TimesheetEntry>[] = [];

      // Day columns for each week - using built-in editing
      dayLabels.forEach((dayLabel, dayIdx) => {
        const dayKey = dayKeys[dayIdx];
        weekColumns.push({
          id: `week${weekNumber}_${dayKey}`,
          header: dayLabel,
          size: 60,
          accessorFn: (row) => row.weeks[weekIdx]?.[dayKey] ?? 0,
          meta: {
            weekIndex: weekIdx,
            dayKey: dayKey,
          },
          enableEditing: true, // Enable built-in editing for day columns
        });
      });

      // Week total column
      weekColumns.push({
        id: `week${weekNumber}_total`,
        header: `Wk${weekNumber}`,
        size: 70,
        accessorFn: (row) => {
          const week = row.weeks[weekIdx];
          return week ? calculateWeekTotal(week) : 0;
        },
        Cell: ({ cell }) => (
          <Box
            style={{
              fontWeight: 'bold',
              backgroundColor: '#e3f2fd',
              padding: '4px 8px',
              borderRadius: 4,
            }}
          >
           {cell.getValue<number>()}
          </Box>
          
        ),
        enableEditing: false,
      });

      cols.push({
        id: `week${weekNumber}`,
        header: `Week ${weekNumber}`,
        columns: weekColumns,
      });
    }

    // Total hours column
    cols.push({
      id: 'totalHours',
      header: 'Total',
      size: 80,
      accessorFn: (row) => calculateRowTotal(row),
      Cell: ({ cell }) => (
        <Box
          style={{
            fontWeight: 'bold',
            backgroundColor: '#c8e6c9',
            padding: '4px 8px',
            borderRadius: 4,
            textAlign: 'center',
          }}
        >
          {cell.getValue<number>()}
        </Box>
      ),
      enableEditing: false,
    });

    return cols;
  }, [data, creatingRowData, openWorkforceCodeModal]);

  const table = useMantineReactTable({
    columns,
    data,
    enableColumnOrdering: false,
    enableColumnFilterModes: false,
    enablePagination: false,
    enableRowSelection: false,
    enableColumnFilters: false,
    enableFullScreenToggle: false,
    enableSorting: false,
    enableGlobalFilter: true,
    enableTopToolbar: true,
    enableBottomToolbar: true,
    enableStickyHeader: true,
    // Option 2: Use built-in cell editing
    editDisplayMode: 'table',
    enableEditing: true,
    createDisplayMode: 'row',
    enableRowActions: true,
    enablePinning: true,
    enableColumnPinning: true,
    layoutMode: 'semantic',
    enableColumnResizing: false,
    enableDensityToggle: false,
    initialState: { 
      density: 'xs',
      columnPinning: { left: ['mrt-row-actions', 'workCode', 'accountCode'] },
     //showGlobalFilter: true
    },

    // Configure the edit text input for hour cells
    mantineEditTextInputProps: handleSaveCell,
    // Handle saving a newly created row
    onCreatingRowSave: ({ row, table }) => {
      // Use creatingRowData if available (contains selected codes), otherwise fall back to row.original
      const sourceData = creatingRowData || row.original;
      const newEntry: TimesheetEntry = {
        ...sourceData,
        timesheetEntryId: Date.now(), // Generate a unique ID
      };
      setData((prev) => [...prev, newEntry]);
      setCreatingRowData(null); // Clear the creating row data
      setIsCreatingRow(false);
      table.setCreatingRow(null); // Exit creating mode
    },
    // Handle canceling row creation
    onCreatingRowCancel: () => {
      // Clear creating row state when canceled
      setCreatingRowData(null);
      setIsCreatingRow(false);
    },
    mantineTableContainerProps: {
      style: {
        maxHeight: '400px',
        width: '100%',
      },
    },
    mantineTableProps: {
      striped: true,
      withTableBorder: true,
      withColumnBorders: true,      
    },
    mantineTableHeadCellProps: {
      align: 'center',
    },
    mantineTableBodyCellProps: ({ cell, column, row }) => {
      const columnId = column.id;
      const value = cell.getValue();
      const workCode = row.original?.workforceCode?.shortWorkforceCode || '';

      let ariaLabel = '';

      if (columnId === 'workCode') {
        ariaLabel = `Work Code: ${value}`;
      } else if (columnId === 'accountCode') {
        ariaLabel = `Account Code: ${value}`;
      } else if (columnId.includes('_total')) {
        ariaLabel = `Week total for ${workCode}: ${value} hours`;
      } else if (columnId === 'totalHours') {
        ariaLabel = `Total hours for ${workCode}: ${value} hours`;
      } else if (columnId.includes('Hours')) {
        // Day columns - extract day name from header
        const dayName = column.columnDef.header;
        ariaLabel = `${dayName} hours for ${workCode}: ${value}`;
      } else {
        ariaLabel = `${column.columnDef.header}: ${value}`;
      }

      return {
        align: 'center' as const,
        'aria-label': ariaLabel,
      };
    },
    renderBottomToolbar: () => (
      <Box
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '16px',
          backgroundColor: '#f5f5f5',
          borderTop: '2px solid #e0e0e0',
        }}
      >
        <Box style={{ display: 'flex', gap: '24px' }}>
          {data[0]?.weeks.map((_, weekIdx) => {
            const weekTotal = data.reduce((sum, entry) => {
              const week = entry.weeks[weekIdx];
              return sum + (week ? calculateWeekTotal(week) : 0);
            }, 0);
            return (
              <Box key={weekIdx} style={{ textAlign: 'center' }}>
                <Text size="sm" c="dimmed">
                  Week {weekIdx + 1} Total
                </Text>
                <Text size="lg" style={{ fontWeight: 700 }}>
                  {weekTotal}
                </Text>
              </Box>
            );
          })}
          <Box style={{ textAlign: 'center' }}>
            <Text size="sm" c="dimmed">
              Grand Total
            </Text>
            <Text size="lg" style={{ fontWeight: 700 }} c="green">
              {data.reduce((sum, entry) => sum + calculateRowTotal(entry), 0)}
            </Text>
          </Box>
        </Box>
      </Box>
    ),
    renderTopToolbarCustomActions: ({ table }) => {
      // Default empty timesheet entry for new rows
      const defaultNewEntry: TimesheetEntry = {
        timesheetEntryId: undefined,
        timesheetId: 100,
        payperiodId: 1,
        workforceCode: undefined,
        accountCode: undefined,
        weeks: [
          { week: 1, sunHours: 0, monHours: 0, tueHours: 0, wedHours: 0, thuHours: 0, friHours: 0, satHours: 0 },
          { week: 2, sunHours: 0, monHours: 0, tueHours: 0, wedHours: 0, thuHours: 0, friHours: 0, satHours: 0 },
        ],
      };

      return (
        <Box style={{ display: 'flex', gap: '16px', padding: '8px' }}>
          <Button
            onClick={() => {
              table.setCreatingRow(
                createRow(table, defaultNewEntry)
              );
            }}
          >
            Add Work Entry
          </Button>
          <Button
            onClick={() => {
              const leaveEntry: TimesheetEntry = {
                ...defaultNewEntry,
                workforceCode: availableWorkCodes[3], // LV001 (PTO)
                accountCode: availableAccountCodes[3], // MNT001 (using as Leave account)
              };
              table.setCreatingRow(
                createRow(table, leaveEntry)
              );
            }}
          >
            Add Leave Entry
          </Button>
        </Box>
      );
    },
    renderRowActions: ({ row }) => (
      <Box style={{ display: 'flex', flexWrap: 'nowrap', gap: '8px' }}>
        {/* <ActionIcon
          color="blue"
          onClick={() =>
            window.open(
              `mailto:test@mailinator.com?subject=Hello ${row.original.codes[0]?.code}!`,
            )
          }
        >
          <IconSend />
        </ActionIcon> */}
        <Center style={{ width: '100%' }}>
          <ActionIcon
            color="red"
            onClick={() => {
              setData((prev) => prev.filter((_, idx) => idx !== row.index));
            }}
          >            
            <IconTrash/>   
          </ActionIcon>

        </Center>
        {/*<Button>Button 1</Button>*/}
      </Box>
    ),
  });

  return (
    <Box style={{ padding: '20px' }}>
      <Text size="xl" style={{ fontWeight: 'bold' }} mb="md">
        Timesheet Table
      </Text>
      <MantineReactTable table={table} />

      {/* Workforce Code Selection Modal */}
      <WorkforceCodeModal
        opened={workforceCodeModalOpened}
        onClose={closeWorkforceCodeModal}
        onSelect={handleWorkforceCodeSelect}
        availableWorkforceCode={availableWorkforceCode}
        title={modalTitle}
      />
    </Box>
  );
};

export default MantineReactTimeSheetTable;
