import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map } from 'rxjs';

function formatDate(d: Date): string {
  if (!d) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  private readonly location = new BehaviorSubject<string>('kudakuda_stock');
  readonly location$ = this.location.asObservable();

  private readonly selectedDate = new BehaviorSubject<string>(formatDate(new Date()));
  readonly selectedDate$ = this.selectedDate.asObservable();

  /**
   * An observable that emits a unique key whenever the date or location changes.
   * Example output: 'kudakuda_stock_20231027'
   */
  readonly dateAndLocationKey$ = combineLatest([
    this.location$,
    this.selectedDate$
  ]).pipe(
    map(([location, date]) => `${location}_${date.replace(/-/g, '')}`)
  );

  /** A synchronous method to get the current key. */
  getCurrentDateAndLocationKey(): string {
    const location = this.location.getValue();
    const date = this.selectedDate.getValue();
    return `${location}_${date.replace(/-/g, '')}`;
  }

  constructor() { }
  setLocation(location: string) {
    this.location.next(location);
  }

  setDate(date: string | Date) {
    let internalDateString: string;
    if (typeof date === 'string') {
      const parts = date.split('-');
      // If format is DD-MM-YYYY, convert to YYYY-MM-DD for internal state
      internalDateString = parts[2] ? `${parts[2]}-${parts[1]}-${parts[0]}` : date;
    } else {
      // If it's a Date object, format it to YYYY-MM-DD
      internalDateString = formatDate(date);
    }
    this.selectedDate.next(internalDateString);
  }

}
