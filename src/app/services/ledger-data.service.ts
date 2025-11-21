import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { TenDayLedger } from '../components/mcm/model/ledger-day.model';
import { generateSampleLedgerData } from '../components/mcm/model/sample-ledger-data';

@Injectable({
  providedIn: 'root'
})
export class LedgerDataService {
  
  /**
   * Get billing period data for a specific period start date
   * @param periodStart The start date of the billing period (1st, 11th, or 21st of the month)
   * @returns Observable of TenDayLedger data for the billing period
   */
  getBillingPeriodData(periodStart: Date): Observable<TenDayLedger> {
    // For now, generate mock data
    // Later this will be replaced with actual HTTP call to REST API
    const mockData = generateSampleLedgerData(periodStart);
    
    // Simulate network delay (remove this when using real API)
    return of(mockData).pipe(delay(300));
  }
}
