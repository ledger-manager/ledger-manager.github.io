import { CustDayRecord, LedgerDayRecord, TenDayLedger } from './ledger-day.model';
import { MEMBERS } from './member-data.model';

const customerNos = MEMBERS.map(m => m.custNo); // All customers

export function getRandomQty(): number {
  return Math.round((Math.random() * 4.5 + 0.5) * 10) / 10;
}

export function getRandomFat(): number {
  return Math.round((Math.random() * 7 + 3) * 10) / 10;
}

function getPastDate(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Get the start date of the current billing period
 * @returns Date object for the 1st, 11th, or 21st of the current month
 */
export function getCurrentPeriodStart(): Date {
  const today = new Date();
  const currentDay = today.getDate();
  const periodStart = new Date(today);
  
  if (currentDay >= 21) {
    periodStart.setDate(21);
  } else if (currentDay >= 11) {
    periodStart.setDate(11);
  } else {
    periodStart.setDate(1);
  }
  
  periodStart.setHours(0, 0, 0, 0);
  return periodStart;
}

/**
 * Get the end date of a billing period
 * @param periodStart The start date of the billing period (1st, 11th, or 21st)
 * @returns The last date of the billing period
 */
export function getPeriodEnd(periodStart: Date): Date {
  const startDay = periodStart.getDate();
  const periodEnd = new Date(periodStart);
  
  if (startDay === 1) {
    periodEnd.setDate(10);
  } else if (startDay === 11) {
    periodEnd.setDate(20);
  } else { // 21st
    // Get last day of the month
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    periodEnd.setDate(0); // Sets to last day of previous month
  }
  
  periodEnd.setHours(23, 59, 59, 999);
  return periodEnd;
}

/**
 * Get the start date of the previous billing period
 * @param periodStart The current period start date (1st, 11th, or 21st)
 * @returns The start date of the previous billing period
 */
export function getPreviousPeriodStart(periodStart: Date): Date {
  const startDay = periodStart.getDate();
  const previousPeriod = new Date(periodStart);
  
  if (startDay === 1) {
    // If current is 1st, previous is 21st of previous month
    previousPeriod.setMonth(previousPeriod.getMonth() - 1);
    previousPeriod.setDate(21);
  } else if (startDay === 11) {
    // If current is 11th, previous is 1st of same month
    previousPeriod.setDate(1);
  } else { // 21st
    // If current is 21st, previous is 11th of same month
    previousPeriod.setDate(11);
  }
  
  previousPeriod.setHours(0, 0, 0, 0);
  return previousPeriod;
}

function isCurrentDay(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

function getCurrentHour(): number {
  return new Date().getHours();
}

/**
 * Generate sample ledger data for a billing period
 * @param periodStart The start date of the billing period (1st, 11th, or 21st)
 * @returns TenDayLedger with mock data based on current time
 */
export function generateSampleLedgerData(periodStart: Date): TenDayLedger {
  const billingPeriodData: TenDayLedger = { tenDayStart: periodStart, records: [], custBills: [], totalAmt: 0, receivedAmt: 0, pendingAmt: 0, receivableAmt: 0 };
  
  const now = new Date();
  const currentHour = now.getHours();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  const periodEnd = getPeriodEnd(periodStart);
  const periodEndDate = new Date(periodEnd);
  periodEndDate.setHours(0, 0, 0, 0);
  
  // Determine last date to generate data for based on current time
  let lastDataDate: Date;
  let includeToday = false;
  let fillTodayAM = false;
  
  if (currentHour < 5) {
    // Before 5 AM: Only generate data until yesterday
    lastDataDate = new Date(today);
    lastDataDate.setDate(today.getDate() - 1);
    includeToday = false;
  } else if (currentHour < 12) {
    // 5 AM to 11:59 AM: Include today but leave both AM and PM blank
    lastDataDate = new Date(today);
    includeToday = true;
    fillTodayAM = false;
  } else {
    // 12 PM onwards: Include today, fill AM, leave PM blank
    lastDataDate = new Date(today);
    includeToday = true;
    fillTodayAM = true;
  }
  
  // Generate data for the entire billing period up to lastDataDate
  const periodStartNormalized = new Date(periodStart);
  periodStartNormalized.setHours(0, 0, 0, 0);
  
  let currentDate = new Date(periodStartNormalized);
  
  while (currentDate <= lastDataDate && currentDate <= periodEndDate) {
    const DAY_DATA: CustDayRecord[] = [];
    const isToday = isCurrentDay(currentDate);
    
    customerNos.forEach(custNo => {
      const record: CustDayRecord = {
        custNo: custNo,
        AM: { qty: 0, fat: 0 },
        PM: { qty: 0, fat: 0 }
      };

      if (isToday && includeToday) {
        // Today's data
        if (fillTodayAM) {
          // After noon: fill AM with mock data, leave PM blank
          record.AM = { qty: getRandomQty(), fat: getRandomFat() };
        }
        // Before noon or no fill: leave both blank (qty: 0, fat: 0)
      } else if (!isToday) {
        // Past days: fill both sessions with random chance
        const sessionChance = Math.random();
        if (sessionChance < 0.8) { // Both AM and PM (80% chance)
          record.AM = { qty: getRandomQty(), fat: getRandomFat() };
          record.PM = { qty: getRandomQty(), fat: getRandomFat() };
        } else if (sessionChance < 0.9) { // Only AM (10% chance)
          record.AM = { qty: getRandomQty(), fat: getRandomFat() };
        } else { // Only PM (10% chance)
          record.PM = { qty: getRandomQty(), fat: getRandomFat() };
        }
      }
      
      // Always add the record for all customers
      DAY_DATA.push(record);
    });

    const ledgerDayRecord: LedgerDayRecord = { day: new Date(currentDate), quantities: DAY_DATA};
    billingPeriodData.records.push(ledgerDayRecord);
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return billingPeriodData;
}

export const FULL_LEDGER_DATA: TenDayLedger[] = [];

export const PAY_PERIOD_DATA: TenDayLedger = generateSampleLedgerData(getCurrentPeriodStart());
