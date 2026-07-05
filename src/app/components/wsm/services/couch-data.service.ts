import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { StockPayload } from '../models/stock-payload.model';
import { ProductPrice } from '../models/product-list.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CouchDataService {
  private readonly priceDocId = 'PRODUCT_PRICE_LIST';
  private readonly priceDocUrl = `${environment.BASE_URL}/${environment.WSM_DB_NAME}/${this.priceDocId}`;

  getPrice(): Observable<ProductPrice | null> {
    const url = `${this.priceDocUrl}?t=${Date.now()}`;

    return this.http.get<any>(url, { withCredentials: true }).pipe(
      map((doc) => ({
        effDate: doc?.effDate || '',
        itemType: 'products',
        products: doc?.products || [],
        saleAmt: doc?.saleAmt || 0,
        stockAmt: doc?.stockAmt || 0
      } as ProductPrice)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return of(null);
        }
        return of(null);
      })
    );
  }

  getStock(dateKey: string): Observable<StockPayload | null> {
    // Stubbed placeholder until real CouchDB fetch logic is implemented.
    const empty: StockPayload = {
      dateId: dateKey,
      itemType: 'stock',
      values: [],
      saleAmt: 0,
      stockAmt: 0
    };
    return of(empty);
  }

  savePrice(payload: ProductPrice): Observable<boolean> {
    return this.http.get<any>(this.priceDocUrl, { withCredentials: true }).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return of(null);
        }
        throw error;
      }),
      switchMap((existingDoc) => {
        const docToSave: any = {
          _id: this.priceDocId,
          ...payload,
          itemType: 'products'
        };

        if (existingDoc?._rev) {
          docToSave._rev = existingDoc._rev;
        }

        return this.http.put<any>(this.priceDocUrl, docToSave, { withCredentials: true }).pipe(
          map((response) => !!response?.ok),
          catchError(() => of(false))
        );
      }),
      catchError(() => of(false))
    );
  }

  constructor(private http: HttpClient) {}

  // ...existing code...
}
