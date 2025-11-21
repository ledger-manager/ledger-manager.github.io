import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { RateCard } from '../components/mcm/model/rate-card.model';
import { generateMockRateCard } from '../components/mcm/model/sample-rate-card-data';

@Injectable({
  providedIn: 'root'
})
export class RateCardService {

  /**
   * Get the applicable pay rate for a given billing period start date
   * @param billingPeriodStartDate The start date of the billing period
   * @returns Observable of RateCard
   */
  getPayRate(billingPeriodStartDate: Date): Observable<RateCard> {
    // TODO: Replace with actual REST API call
    const rateCard = generateMockRateCard();
    
    // Simulate network delay
    return of(rateCard).pipe(delay(100));
  }
}
