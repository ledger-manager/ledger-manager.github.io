import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { TenDayLedger, LedgerDayRecord, CustDayRecord } from '../components/mcm/model/ledger-day.model';
import { MemberData } from '../components/mcm/model/member-data.model';
import { PAY_PERIOD_DATA } from '../components/mcm/model/sample-ledger-data';
import { MEMBERS } from '../components/mcm/model/member-data.model';
import { getCurrentPeriodStart, getPeriodEnd } from '../components/mcm/model/sample-ledger-data';
import { CouchdbService, CouchDBPutResponse } from './couchdb.service';
import { CustomerService } from './customer.service';

export interface LedgerDocument {
  _id?: string;
  _rev?: string;
  ledger: TenDayLedger;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class LedgerService {
  private ledgerDocuments: Map<string, LedgerDocument> = new Map();

  constructor(
    private couchdbService: CouchdbService,
    private customerService: CustomerService
  ) {}

  /**
   * Get ledger data for the ten-day periods (MOCK DATA - kept for reference)
   * In the future, this will call a backend API
   */
  getLedgerDataMock(): Observable<TenDayLedger> {
    return of(PAY_PERIOD_DATA);
  }

  /**
   * Get all members/customers from CouchDB
   * @returns Observable of MemberData array
   */
  getMembers(): Observable<MemberData[]> {
    return this.customerService.getCustomers();
  }

  /**
   * Generate document ID from tenDayStart date
   * Format: yyyyMMdd_LEDGER (e.g., 20251101_LEDGER)
   */
  private getDocumentId(tenDayStart: Date): string {
    const year = tenDayStart.getFullYear();
    const month = String(tenDayStart.getMonth() + 1).padStart(2, '0');
    const day = String(tenDayStart.getDate()).padStart(2, '0');
    return `${year}${month}${day}_LEDGER`;
  }

  /**
   * Get ledger data from CouchDB for a specific billing period
   * @param tenDayStart The start date of the billing period
   * @returns Observable of TenDayLedger
   */
  getLedgerData(tenDayStart?: Date): Observable<TenDayLedger> {
    // Use current period start if not provided
    const periodStart = tenDayStart || getCurrentPeriodStart();
    const documentId = this.getDocumentId(periodStart);

    // Always create the full empty ledger structure for the period
    const emptyLedger = this.createEmptyLedger(periodStart);

    return this.couchdbService.getDocument<LedgerDocument>(documentId).pipe(
      map(document => {
        // Store the full document including _rev for future updates
        this.ledgerDocuments.set(documentId, document);
        // Convert date strings back to Date objects
        const loadedLedger = this.deserializeLedger(document.ledger);
        // Merge loaded ledger with empty ledger to fill missing days/customers
        const mergedRecords = emptyLedger.records.map(emptyDay => {
          const loadedDay = loadedLedger.records.find(r => r.day.getTime() === emptyDay.day.getTime());
          if (!loadedDay) return emptyDay;
          // For each customer, fill missing sessions
          const mergedQuantities = emptyDay.quantities.map(emptyCust => {
            const loadedCust = loadedDay.quantities.find(q => q.custNo === emptyCust.custNo);
            if (!loadedCust) return emptyCust;
            return {
              custNo: emptyCust.custNo,
              AM: loadedCust.AM || { qty: 0, fat: 0 },
              PM: loadedCust.PM || { qty: 0, fat: 0 }
            };
          });
          return {
            ...emptyDay,
            ...loadedDay,
            quantities: mergedQuantities
          };
        });
        return {
          ...emptyLedger,
          ...loadedLedger,
          records: mergedRecords
        };
      }),
      catchError(error => {
        // If document doesn't exist (404), return empty TenDayLedger structure
        if (error.status === 404) {
          // ...existing code...
          return of(emptyLedger);
        }
        throw error;
      })
    );
  }

  /**
   * Convert date strings from JSON back to Date objects at midnight local time
   * @param ledger The ledger with string dates
   * @returns Ledger with proper Date objects
   */
  private deserializeLedger(ledger: any): TenDayLedger {
    return {
      ...ledger,
      tenDayStart: this.parseDateAtMidnight(ledger.tenDayStart),
      records: ledger.records.map((record: any) => ({
        ...record,
        day: this.parseDateAtMidnight(record.day)
      }))
    };
  }

  /**
   * Convert Date objects to YYYY-MM-DD strings for storage
   * @param ledger The ledger with Date objects
   * @returns Ledger with date strings
   */
  private serializeLedger(ledger: TenDayLedger): any {
    const getDateString = (date: Date): string => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    return {
      ...ledger,
      tenDayStart: getDateString(ledger.tenDayStart),
      records: ledger.records.map(record => ({
        ...record,
        day: getDateString(record.day)
      }))
    };
  }

  /**
   * Parse a date string and return a Date object at midnight local time
   * @param dateStr Date string in YYYY-MM-DD or ISO format
   * @returns Date at midnight local time
   */
  private parseDateAtMidnight(dateStr: string | Date): Date {
    if (dateStr instanceof Date) {
      const d = new Date(dateStr);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    
    // Parse YYYY-MM-DD format to avoid timezone issues
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day, 0, 0, 0, 0);
    }
    
    // Fallback
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Create empty ledger with records for all dates and customers in billing period
   * @param periodStart The start date of the billing period
   * @returns Empty TenDayLedger with initialized records up to current day
   */
  private createEmptyLedger(periodStart: Date): TenDayLedger {
    const periodEnd = getPeriodEnd(periodStart);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Use the earlier of period end or today (don't create records for future dates)
    const endDate = periodEnd < today ? periodEnd : today;
    
    const records: LedgerDayRecord[] = [];
    
    // Create empty records for each date from period start up to current day
    const currentDate = new Date(periodStart);
    while (currentDate <= endDate) {
      const quantities: CustDayRecord[] = [];
      
      // Create empty customer records for all members
      MEMBERS.forEach(member => {
        quantities.push({
          custNo: member.custNo,
          AM: { qty: 0, fat: 0 },
          PM: { qty: 0, fat: 0 }
        });
      });
      
      records.push({
        day: new Date(currentDate),
        quantities: quantities,
        isVerified: false,
        dayTotal: {
          AM: { qty: 0, fat: 0 },
          PM: { qty: 0, fat: 0 }
        }
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return {
      tenDayStart: periodStart,
      records: records,
      custBills: [],
      totalAmt: 0,
      receivableAmt: 0,
      receivedAmt: 0,
      pendingAmt: 0,
      isBilled: false
    };
  }

  /**
   * Save ledger entry data to CouchDB
   * @param ledgerData The TenDayLedger to save
   * @returns Observable of the put response
   */
  saveLedgerEntry(ledgerData: TenDayLedger): Observable<CouchDBPutResponse> {
    // Ensure tenDayStart is a Date object
    const tenDayStart = ledgerData.tenDayStart instanceof Date 
      ? ledgerData.tenDayStart 
      : new Date(ledgerData.tenDayStart);
    
    const documentId = this.getDocumentId(tenDayStart);
    
    // Serialize dates to YYYY-MM-DD strings before saving
    const serializedLedger = this.serializeLedger(ledgerData);
    
    const document: LedgerDocument = {
      ledger: serializedLedger,
      updatedAt: new Date().toISOString()
    };

    // Include _rev if we have it (for updates)
    const existingDoc = this.ledgerDocuments.get(documentId);
    if (existingDoc?._rev) {
      document._rev = existingDoc._rev;
    }

    return this.couchdbService.putDocument(documentId, document).pipe(
      switchMap(response => {
        // After successful save, fetch the document back to get latest _rev
        return this.couchdbService.getDocument<LedgerDocument>(documentId).pipe(
          map(fetchedDoc => {
            // Store the full document with updated _rev
            this.ledgerDocuments.set(documentId, fetchedDoc);
            return response;
          })
        );
      })
    );
  }
}
