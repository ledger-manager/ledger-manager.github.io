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
      const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
      const dmyDatePattern = /^\d{2}-\d{2}-\d{4}$/;

      if (isoDatePattern.test(date)) {
        internalDateString = date;
      } else if (dmyDatePattern.test(date)) {
        internalDateString = `${parts[2]}-${parts[1]}-${parts[0]}`;
      } else {
        const parsed = new Date(date);
        internalDateString = isNaN(parsed.getTime()) ? date : formatDate(parsed);
      }
    } else {
      internalDateString = formatDate(date);
    }
    this.selectedDate.next(internalDateString);
  }

}
