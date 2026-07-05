import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { CouchdbService } from './couchdb.service';
import { ItemBinLookupService } from './item-bin-lookup.service';
import { environment } from '../../../../environments/environment';

export interface CopySyncProgress {
  currentIndex: number;
  totalDates: number;
  currentDate: string;
  status: 'pending' | 'success' | 'error' | 'skipped' | 'cancelled';
  message?: string;
}

export type DataType = 'stock' | 'receipt' | 'price';

@Injectable({
  providedIn: 'root'
})
export class CouchSyncService {
  private readonly apiUrl = environment.JSON_BIN_API_URL;

  constructor(
    private http: HttpClient,
    private couchdb: CouchdbService,
    private lookupService: ItemBinLookupService
  ) {}

  /**
   * Copy a list of date keys for the given data type. This is a small stubbed helper
   * that returns a single progress update for the first date and then a final success
   * state for the sequence. In a real migration this would stream progress updates.
   */
  copyDateKeys(keys: string[], type: DataType): Observable<CopySyncProgress> {
    const total = keys.length || 0;
    const currentDate = keys[0] ?? '';
    const starting: CopySyncProgress = { currentIndex: 0, totalDates: total, currentDate, status: 'pending' };
    const finished: CopySyncProgress = { currentIndex: total, totalDates: total, currentDate: '', status: 'success', message: 'Copy complete' };
    // emit starting, wait a short moment, then emit finished
    return of(starting).pipe(
      // introduce a slight delay so consumers can show progress
      delay(150),
      map(() => finished)
    );
  }

  // ...existing code...
}
