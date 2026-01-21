import { WorkforceCode } from './workcode.types';

// export interface TimesheetEntry {
//   timesheetEntryId?: number;
//   timesheetId?: number;
//   payperiodId?: number;
//   workCodeId?: number;
//   accountCodeId?: number;
//   su1Hours: number;
//   m1Hours: number;
//   t1Hours: number;
//   w1Hours: number;
//   th1Hours: number;
//   f1Hours: number;
//   sa1Hours: number;
//   su2Hours: number;
//   m2Hours: number;
//   t2Hours: number;
//   w2Hours: number;
//   th2Hours: number;
//   f2Hours: number;
//   sa2Hours: number;
// }


export interface Weeks {
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