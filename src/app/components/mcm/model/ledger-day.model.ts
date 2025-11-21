export interface MilkRecord {
  qty: number;
  fat: number;
  amount?: number;
}

export interface CustDayRecord {
  custNo: number;  
  AM: MilkRecord;
  PM: MilkRecord;
}

export interface LedgerDayRecord {
  day: Date;
  quantities: CustDayRecord[];
  isVerified?: boolean;
  dayTotal?: {
    AM: MilkRecord;
    PM: MilkRecord;
  };
}

export interface CustBill {
  custNo: number;
  totalQty: number;
  amount: number;
  prevDueAmt: number;
  paidAmt: number;
  dueAmt: number;
  remarks?: string;
}

export interface TenDayLedger {
  tenDayStart: Date;
  records: LedgerDayRecord[];
  custBills: CustBill[];
  totalAmt: number;
  receivableAmt: number;
  receivedAmt: number;
  pendingAmt: number;
  isBilled?: boolean;  
}
