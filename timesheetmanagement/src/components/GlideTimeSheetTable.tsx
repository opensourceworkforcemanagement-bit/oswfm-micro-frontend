/* eslint-disable no-constant-binary-expression */
import "@glideapps/glide-data-grid/dist/index.css";
import "./App.css";

import {
  DataEditor,
  EditableGridCell,
  GridCell,
  GridCellKind,
  GridColumn,
  GridColumnIcon,
  Item
} from "@glideapps/glide-data-grid";
import React from "react";

export interface WrapperProps {
    height: number;
    width?: number;
    children: React.ReactNode;
}

export const Wrapper: React.FC<WrapperProps> = ({ height, width, children }) => {
    return (
      <div className="goodstyle-markdown">
        <div className="wrapper" style={{ height: `${height}vh`, width: width ? `${width}vw` : "100%" }}>
            <div className="wrapper-inner">
                {children}
            </div>
        </div>
      </div>
    );
};

interface Weeks {
  week: number;
  sunHours: number;
  monHours: number;
  tueHours: number;
  wedHours: number;
  thuHours: number;
  friHours: number;
  satHours: number;
  };

interface TimesheetCode {
  codeId: number;
  codeType: string;
  code: string;
}

 export interface TimesheetEntry {
  timesheetEntryId?: number;
  timesheetId?: number;
  payperiodId?: number;
  codes: TimesheetCode[];
  weeks: Weeks[];
}

// Calculate total hours for a single week
export function calculateWeekTotal(week: Weeks): number {
  return week.sunHours + week.monHours + week.tueHours + week.wedHours + week.thuHours + week.friHours + week.satHours;
}

// Calculate total hours for a timesheet entry row (sum of all weeks)
export function calculateRowTotal(entry: TimesheetEntry): number {
  return entry.weeks.reduce((total, week) => total + calculateWeekTotal(week), 0);
}

// Function to generate grid columns from a TimesheetEntry instance
export function generateColumnsFromTimesheetEntry(entry: TimesheetEntry): GridColumn[] {
  const columns: GridColumn[] = [];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Dynamically add columns for each code type from the codes array
  entry.codes.forEach((timesheetCode) => {
    const columnId = `code_${timesheetCode.codeType}`;
    const columnTitle = timesheetCode.codeType
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
      .trim();

    columns.push({
      id: columnId,
      title: columnTitle,
      width: 120,
      //icon: GridColumnIcon.HeaderString
    });
  });
  
  if (entry.weeks.length === 0) {
    // If there are no weeks, still add a default set of columns for one week
    dayLabels.forEach((dayLabel) => {
      const columnId = `${dayLabel.toLowerCase()}1Hours`;
      columns.push({
        id: columnId,
        title: dayLabel,
        width: 60,
        //icon: GridColumnIcon.HeaderNumber
      });
    });
  }
  else if (entry.weeks.length === 1) {
      dayLabels.forEach((dayLabel) => {
        const columnId = `${dayLabel.toLowerCase()}${entry.weeks[0].week}Hours`;
        columns.push({
          id: columnId,
          title: dayLabel,
          width: 60,
          //icon: GridColumnIcon.HeaderNumber
        });
      });
  }
  else {
      // Add columns for each week
    entry.weeks.forEach((week) => {
      // Add columns for each day of the week (Su, M, T, W, Th, F, Sa)
      dayLabels.forEach((dayLabel) => {
        const columnId = `${dayLabel.toLowerCase()}${week.week}Hours`;
        columns.push({
          id: columnId,
          title: dayLabel,
          width: 60,
          //icon: GridColumnIcon.HeaderNumber
        });
      });

      // Add week total column
      columns.push({
        id: `weekend${week.week}Hours`,
        title: `Week${week.week}`,
        width: 80,
        //icon: GridColumnIcon.HeaderNumber
      });
    });
  } 

  // Add total hours column
  columns.push({
    id: "totalHours",
    title: "Total Hours",
    width: 105,
    //icon: GridColumnIcon.HeaderEmoji
  });

  return columns;
}

// Example usage of generateColumnsFromTimesheetEntry:

const data: TimesheetEntry[] = [{
  timesheetEntryId: 1,
  timesheetId: 100,
  payperiodId: 1,
  codes: [
    { codeId: 1, codeType: 'workCode', code: 'Work001' },
    { codeId: 2, codeType: 'accountCode', code: 'ACCT12345' }
  ],
  weeks: [
    { week: 1, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 },
    { week: 2, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 }
  ]
},
{
  timesheetEntryId: 2,
  timesheetId: 100,
  payperiodId: 1,
  codes: [
    { codeId: 3, codeType: 'workCode', code: 'Work002' },
    { codeId: 4, codeType: 'accountCode', code: 'ACCT67890' }
  ],
  weeks: [
    { week: 1, sunHours: 0, monHours: 7, tueHours: 7, wedHours: 7, thuHours: 7, friHours: 7, satHours: 0 },
    { week: 2, sunHours: 0, monHours: 6, tueHours: 6, wedHours: 6, thuHours: 6, friHours: 6, satHours: 0 }
  ]
},
{
  timesheetEntryId: 1,
  timesheetId: 100,
  payperiodId: 1,
  codes: [
    { codeId: 1, codeType: 'workCode', code: 'Work001' },
    { codeId: 2, codeType: 'accountCode', code: 'ACCT12345' }
  ],
  weeks: [
    { week: 1, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 },
    { week: 2, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 }
  ]
},
{
  timesheetEntryId: 2,
  timesheetId: 100,
  payperiodId: 1,
  codes: [
    { codeId: 3, codeType: 'workCode', code: 'Work002' },
    { codeId: 4, codeType: 'accountCode', code: 'ACCT67890' }
  ],
  weeks: [
    { week: 1, sunHours: 0, monHours: 7, tueHours: 7, wedHours: 7, thuHours: 7, friHours: 7, satHours: 0 },
    { week: 2, sunHours: 0, monHours: 6, tueHours: 6, wedHours: 6, thuHours: 6, friHours: 6, satHours: 0 }
  ]
} ,
{
  timesheetEntryId: 1,
  timesheetId: 100,
  payperiodId: 1,
  codes: [
    { codeId: 1, codeType: 'workCode', code: 'Work001' },
    { codeId: 2, codeType: 'accountCode', code: 'ACCT12345' }
  ],
  weeks: [
    { week: 1, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 },
    { week: 2, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 }
  ]
},
{
  timesheetEntryId: 2,
  timesheetId: 100,
  payperiodId: 1,
  codes: [
    { codeId: 3, codeType: 'workCode', code: 'Work002' },
    { codeId: 4, codeType: 'accountCode', code: 'ACCT67890' }
  ],
  weeks: [
    { week: 1, sunHours: 0, monHours: 7, tueHours: 7, wedHours: 7, thuHours: 7, friHours: 7, satHours: 0 },
    { week: 2, sunHours: 0, monHours: 6, tueHours: 6, wedHours: 6, thuHours: 6, friHours: 6, satHours: 0 }
  ]
} ,
{
  timesheetEntryId: 1,
  timesheetId: 100,
  payperiodId: 1,
  codes: [
    { codeId: 1, codeType: 'workCode', code: 'Work001' },
    { codeId: 2, codeType: 'accountCode', code: 'ACCT12345' }
  ],
  weeks: [
    { week: 1, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 },
    { week: 2, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 }
  ]
},
{
  timesheetEntryId: 2,
  timesheetId: 100,
  payperiodId: 1,
  codes: [
    { codeId: 3, codeType: 'workCode', code: 'Work002' },
    { codeId: 4, codeType: 'accountCode', code: 'ACCT67890' }
  ],
  weeks: [
    { week: 1, sunHours: 0, monHours: 7, tueHours: 7, wedHours: 7, thuHours: 7, friHours: 7, satHours: 0 },
    { week: 2, sunHours: 0, monHours: 6, tueHours: 6, wedHours: 6, thuHours: 6, friHours: 6, satHours: 0 }
  ]
},
{
  timesheetEntryId: 1,
  timesheetId: 100,
  payperiodId: 1,
  codes: [
    { codeId: 1, codeType: 'workCode', code: 'Work001' },
    { codeId: 2, codeType: 'accountCode', code: 'ACCT12345' }
  ],
  weeks: [
    { week: 1, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 },
    { week: 2, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 }
  ]
},
{
  timesheetEntryId: 2,
  timesheetId: 100,
  payperiodId: 1,
  codes: [
    { codeId: 3, codeType: 'workCode', code: 'Work002' },
    { codeId: 4, codeType: 'accountCode', code: 'ACCT67890' }
  ],
  weeks: [
    { week: 1, sunHours: 0, monHours: 7, tueHours: 7, wedHours: 7, thuHours: 7, friHours: 7, satHours: 0 },
    { week: 2, sunHours: 0, monHours: 6, tueHours: 6, wedHours: 6, thuHours: 6, friHours: 6, satHours: 0 }
  ]
} ,
{
  timesheetEntryId: 1,
  timesheetId: 100,
  payperiodId: 1,
  codes: [
    { codeId: 1, codeType: 'workCode', code: 'Work001' },
    { codeId: 2, codeType: 'accountCode', code: 'ACCT12345' }
  ],
  weeks: [
    { week: 1, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 },
    { week: 2, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 }
  ]
},
{
  timesheetEntryId: 2,
  timesheetId: 100,
  payperiodId: 1,
  codes: [
    { codeId: 3, codeType: 'workCode', code: 'Work002' },
    { codeId: 4, codeType: 'accountCode', code: 'ACCT67890' }
  ],
  weeks: [
    { week: 1, sunHours: 0, monHours: 7, tueHours: 7, wedHours: 7, thuHours: 7, friHours: 7, satHours: 0 },
    { week: 2, sunHours: 0, monHours: 6, tueHours: 6, wedHours: 6, thuHours: 6, friHours: 6, satHours: 0 }
  ]
} ,
{
  timesheetEntryId: 1,
  timesheetId: 100,
  payperiodId: 1,
  codes: [
    { codeId: 1, codeType: 'workCode', code: 'Work001' },
    { codeId: 2, codeType: 'accountCode', code: 'ACCT12345' }
  ],
  weeks: [
    { week: 1, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 },
    { week: 2, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 }
  ]
},
{
  timesheetEntryId: 2,
  timesheetId: 100,
  payperiodId: 1,
  codes: [
    { codeId: 3, codeType: 'workCode', code: 'Work002' },
    { codeId: 4, codeType: 'accountCode', code: 'ACCT67890' }
  ],
  weeks: [
    { week: 1, sunHours: 0, monHours: 7, tueHours: 7, wedHours: 7, thuHours: 7, friHours: 7, satHours: 0 },
    { week: 2, sunHours: 0, monHours: 6, tueHours: 6, wedHours: 6, thuHours: 6, friHours: 6, satHours: 0 }
  ]
} ,
{
  timesheetEntryId: 1,
  timesheetId: 100,
  payperiodId: 1,
  codes: [
    { codeId: 1, codeType: 'workCode', code: 'Work001' },
    { codeId: 2, codeType: 'accountCode', code: 'ACCT12345' }
  ],
  weeks: [
    { week: 1, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 },
    { week: 2, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 }
  ]
},
{
  timesheetEntryId: 2,
  timesheetId: 100,
  payperiodId: 1,
  codes: [
    { codeId: 3, codeType: 'workCode', code: 'Work002' },
    { codeId: 4, codeType: 'accountCode', code: 'ACCT67890' }
  ],
  weeks: [
    { week: 1, sunHours: 0, monHours: 7, tueHours: 7, wedHours: 7, thuHours: 7, friHours: 7, satHours: 0 },
    { week: 2, sunHours: 0, monHours: 6, tueHours: 6, wedHours: 6, thuHours: 6, friHours: 6, satHours: 0 }
  ]
} ,
{
  timesheetEntryId: 1,
  timesheetId: 100,
  payperiodId: 1,
  codes: [
    { codeId: 1, codeType: 'workCode', code: 'Work001' },
    { codeId: 2, codeType: 'accountCode', code: 'ACCT12345' }
  ],
  weeks: [
    { week: 1, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 },
    { week: 2, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 }
  ]
},
{
  timesheetEntryId: 2,
  timesheetId: 100,
  payperiodId: 1,
  codes: [
    { codeId: 3, codeType: 'workCode', code: 'Work002' },
    { codeId: 4, codeType: 'accountCode', code: 'ACCT67890' }
  ],
  weeks: [
    { week: 1, sunHours: 0, monHours: 7, tueHours: 7, wedHours: 7, thuHours: 7, friHours: 7, satHours: 0 },
    { week: 2, sunHours: 0, monHours: 6, tueHours: 6, wedHours: 6, thuHours: 6, friHours: 6, satHours: 0 }
  ]
} ,
{
  timesheetEntryId: 1,
  timesheetId: 100,
  payperiodId: 1,
  codes: [
    { codeId: 1, codeType: 'workCode', code: 'Work001' },
    { codeId: 2, codeType: 'accountCode', code: 'ACCT12345' }
  ],
  weeks: [
    { week: 1, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 },
    { week: 2, sunHours: 0, monHours: 8, tueHours: 8, wedHours: 8, thuHours: 8, friHours: 8, satHours: 0 }
  ]
},
{
  timesheetEntryId: 2,
  timesheetId: 100,
  payperiodId: 1,
  codes: [
    { codeId: 3, codeType: 'workCode', code: 'Work002' },
    { codeId: 4, codeType: 'accountCode', code: 'ACCT67890' }
  ],
  weeks: [
    { week: 1, sunHours: 0, monHours: 7, tueHours: 7, wedHours: 7, thuHours: 7, friHours: 7, satHours: 0 },
    { week: 2, sunHours: 0, monHours: 6, tueHours: 6, wedHours: 6, thuHours: 6, friHours: 6, satHours: 0 }
  ]
}   
];
const columns = generateColumnsFromTimesheetEntry(data[0]);

// If fetching data is slow you can use the DataEditor ref to send updates for cells
// once data is loaded.
function getData([col, row]: Item): GridCell {
  const entry = data[row];
  const columnId = columns[col]?.id ?? '';

  // Check if this is a code column (starts with 'code_')
  if (columnId.startsWith('code_')) {
    const codeType = columnId.replace('code_', '');
    const codeEntry = entry.codes.find(c => c.codeType === codeType);

    return {
      kind: GridCellKind.Text,
      data: codeEntry?.code ?? '',
      allowOverlay: false,
      displayData: codeEntry?.code ?? '',
      readonly: true
    };
  } else if (columnId === 'totalHours') {
    // Total hours column - sum of all weeks
    const totalHours = calculateRowTotal(entry);
    return {
      kind: GridCellKind.Number,
      data: totalHours,
      allowOverlay: false,
      displayData: String(totalHours),
      readonly: true
    };
  } else if (columnId.startsWith('weekend')) {
    // Week total column
    const weekNumber = parseInt(columnId.replace('weekend', '').replace('Hours', ''), 10);
    const week = entry.weeks.find(w => w.week === weekNumber);
    const weekTotal = week ? calculateWeekTotal(week) : 0;
    return {
      kind: GridCellKind.Number,
      data: weekTotal,
      allowOverlay: false,
      displayData: String(weekTotal),
      readonly: true
    };
  } else if (columnId.includes('Hours')) {
    // Day hours columns
    const columnIdParts = columnId.split(/(?=\d)|(?<=\d)/);
    const weekIndex = parseInt(columnIdParts[1] as string, 10) - 1;
    const dayKey = columnIdParts[0] + columnIdParts[2] as keyof Weeks;
    const weekValue = entry.weeks[weekIndex]?.[dayKey] as number;

    return {
      kind: GridCellKind.Number,
      data: weekValue,
      allowOverlay: true,
      displayData: String(weekValue),
      readonly: false
    };
  }

  // Fallback for any other columns
  return {
    kind: GridCellKind.Text,
    data: '',
    allowOverlay: false,
    displayData: '',
    readonly: true
  };
}



export default function GlideTimeSheetTable() {

  const onCellEdited = React.useCallback((cell: Item, newValue: EditableGridCell) => {
    if (newValue.kind !== GridCellKind.Number) {
        // we only have number cells
        return;
    }
    
    const [col, row] = cell;
    const columnId = columns[col]?.id?.split(/(?=\d)|(?<=\d)/) ?? [];
    const weekIndex = parseInt(columnId[1] as string, 10) - 1;
    const dayKey = columnId[0] + columnId[2] as keyof Weeks;

    (data[row].weeks[weekIndex][dayKey] as number) = newValue.data as number;
}, []);

  return (
      <div className="sheet">
        <Wrapper height={50} width={50}>
          <DataEditor
            columns={columns}
            getCellContent={getData}
            rows={data.length}
            getCellsForSelection
            rowMarkers="number"
            smoothScrollX
            smoothScrollY
            onCellEdited={onCellEdited}
            freezeTrailingRows={2}
            getRowThemeOverride={i =>
              
                    i % 2  === 0 ?
                  {
                      bgCell: "#570cee88",
                      // borderColor: "#e03f8a",
                      // textDarkColor: "#12c447",
                      // textLightColor: "#ffffff",
                      // textHeaderColor: "#c91a1a"

                  }
                  : undefined
              }
            />
        </Wrapper>
    </div>
  );
}
