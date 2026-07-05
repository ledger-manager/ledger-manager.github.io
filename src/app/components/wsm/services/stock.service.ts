import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { StockPayload } from '../models/stock-payload.model';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StockService {

  private readonly baseDbUrl = `${environment.BASE_URL}/${environment.WSM_DB_NAME}`;

  constructor(
    private http: HttpClient
  ) { }

  private resolveDateToken(key: string): string {
    const match = key?.match(/(\d{8})$/);
    if (match?.[1]) {
      return match[1];
    }

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  }

  private buildDocId(key: string): string {
    return `STOCK_${this.resolveDateToken(key)}`;
  }

  /**
   * Get stock payload for a given date/location key.
   */
  getStock(dateKey: string): Observable<StockPayload> {
    const docId = this.buildDocId(dateKey);
    const docUrl = `${this.baseDbUrl}/${docId}`;

    return this.http.get<any>(docUrl, { withCredentials: true }).pipe(
      map((doc) => ({
        dateId: doc?.dateId || dateKey,
        itemType: 'stock',
        values: doc?.values || [],
        saleAmt: doc?.saleAmt || 0,
        stockAmt: doc?.stockAmt || 0
      } as StockPayload)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return of({
            dateId: dateKey,
            itemType: 'stock',
            values: [],
            saleAmt: 0,
            stockAmt: 0
          } as StockPayload);
        }
        return throwError(() => error);
      })
    );
  }

  /** Save stock payload. Returns true on success. */
  saveStock(payload: StockPayload): Observable<boolean> {
    const key = payload?.dateId || '';
    const docId = this.buildDocId(key);
    const docUrl = `${this.baseDbUrl}/${docId}`;

    return this.http.get<any>(docUrl, { withCredentials: true }).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return of(null);
        }
        throw error;
      }),
      switchMap((existingDoc) => {
        const docToSave: any = {
          _id: docId,
          itemType: 'stock',
          values: payload.values || [],
          saleAmt: payload.saleAmt || 0,
          stockAmt: payload.stockAmt || 0
        };

        if (existingDoc?._rev) {
          docToSave._rev = existingDoc._rev;
        }

        return this.http.put<any>(docUrl, docToSave, { withCredentials: true }).pipe(
          map((response) => !!response?.ok),
          catchError(() => of(false))
        );
      }),
      catchError(() => of(false))
    );
  }

  // ...existing code...
}
