import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { switchMap, catchError, tap, delay, map } from 'rxjs/operators';
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

  // ...existing code...
}
