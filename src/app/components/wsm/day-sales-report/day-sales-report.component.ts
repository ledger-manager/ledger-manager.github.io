import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AppStateService } from '../services/app-state.service';
import { ProductPriceService } from '../services/product-price.service';
import { StockService } from '../services/stock.service';
import { ReceiptService } from '../services/receipt.service';
import { StockPayload } from '../models/stock-payload.model';
import { PdfExportService } from '../services/pdf-export.service';
import { cloneDeep, isEqual } from 'lodash-es';
import { Subscription, forkJoin, from, of, take, combineLatest } from 'rxjs';
import { map, concatMap, filter, catchError, defaultIfEmpty, finalize, timeout, tap } from 'rxjs/operators';
import { Product } from '../models/product.model';
import { ItemBinLookupService } from '../services/item-bin-lookup.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';

interface StockSalesRow {
  seq: number;
  name: string;
  prev: { q: number | null; p: number | null; n: number | null; d: number | null };
  curr: { q: number | null; p: number | null; n: number | null; d: number | null };
  sales: { q: number | null; p: number | null; n: number | null; d: number | null };
  amount: number | null;
  prices: { q: number | null; p: number | null; n: number | null; d: number | null };
  receipt: { q: number | null; p: number | null; n: number | null; d: number | null };
}

@Component({
  selector: 'app-day-sales-report',
  templateUrl: './day-sales-report.component.html',
  standalone: true,
  imports: [TableModule, ButtonModule, CommonModule],
  styles: ["@import '../shared-styles.scss';"]
})

export class DaySalesReportComponent implements OnInit, OnDestroy {
  selectedDate: string | null = null;
  selectedLocation: string | null = null;
  prevDate: string | null = null;
  rows: StockSalesRow[] = [];
  editRows: StockSalesRow[] = [];
  totalAmount: number = 0;
  isDataLoaded = false;
  isLoading = false;
  isSaving = false;
  noDataAvailable: boolean = false;
  hasReceiptData: boolean = false;
  hasChanges = false;
  editingRowIndex: number | null = null;
  saveStatus: { type: 'success' | 'error'; message: string } | null = null;
  private sub: Subscription | null = null;
  private productMap = new Map<number, Product>();

  constructor(
    private appState: AppStateService,
    private stockService: StockService,
    private productPriceService: ProductPriceService,
    private receiptService: ReceiptService,
    private pdfExportService: PdfExportService,
    private itemBinLookupService: ItemBinLookupService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sub = combineLatest([this.appState.selectedDate$, this.appState.location$]).subscribe(([date, location]: [string, string]) => {
      const wasLoaded = this.isDataLoaded;
      const prevDate = this.selectedDate;
      const prevLocation = this.selectedLocation;
      this.selectedDate = date;
      this.selectedLocation = location;
      this.isDataLoaded = false;
      if (!wasLoaded || prevDate !== date || prevLocation !== location) {
        this.buildReport();
      }
    });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  formatDisplayDate(date: string | null): string {
    if (!date) return '';
    let d: Date;
    const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
    if (isoPattern.test(date)) {
      d = this.createDateFromString(date);
    } else {
      d = new Date(date);
    }
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatHeaderDate(date: string | null): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  private createDateFromString(date: string): Date {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private formatDateString(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private resolvePriceValue(v: any): number | null {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
    if (typeof v === 'object') {
      // Attempt to find a numeric value in the object (common CouchDB shapes)
      for (const key of Object.keys(v)) {
        const val = (v as any)[key];
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          const n = Number(val);
          if (Number.isFinite(n)) return n;
        }
        if (typeof val === 'object') {
          const nested = this.resolvePriceValue(val);
          if (nested !== null) return nested;
        }
      }
    }
    return null;
  }

  hasNextDate(): boolean {
    if (!this.selectedDate) {
      return false;
    }
    const current = this.createDateFromString(this.selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return current < today;
  }

  hasPreviousDate(): boolean {
    return !!this.selectedDate;
  }

  goToPreviousDate(): void {
    if (!this.selectedDate) {
      return;
    }
    const date = this.createDateFromString(this.selectedDate);
    date.setDate(date.getDate() - 1);
    this.appState.setDate(this.formatDateString(date));
  }

  goToNextDate(): void {
    if (!this.selectedDate || !this.hasNextDate()) {
      return;
    }
    const date = this.createDateFromString(this.selectedDate);
    date.setDate(date.getDate() + 1);
    this.appState.setDate(this.formatDateString(date));
  }

  private buildDateKey(date: string): string {
    const location = this.selectedLocation ?? '';
    return `${location}_${date.replace(/-/g, '')}`;
  }

  private getPreviousAvailableStock(date: string, daysToCheck = 4) {
    const baseDate = this.createDateFromString(date);
    const candidates: Array<{ date: string; key: string }> = [];

    for (let i = 1; i <= daysToCheck; i++) {
      const candidateDate = new Date(baseDate);
      candidateDate.setDate(candidateDate.getDate() - i);
      const formatted = this.formatDateString(candidateDate);
      candidates.push({ date: formatted, key: this.buildDateKey(formatted) });
    }

    // Try candidates in order (recent -> older). Log checks to help diagnose unexpected picks.
    return from(candidates).pipe(
      concatMap(item => this.stockService.getStock(item.key).pipe(
        take(1),
        map(payload => ({ date: item.date, payload })),
        tap((res) => {
          try {
            const values = res?.payload?.values ?? [];
            const hasQty = values.some((v: any) => v && (v.qqty != null || v.pqty != null || v.nqty != null || v.dqty != null));
            console.debug('getPreviousAvailableStock check', { date: res?.date, key: item.key, valuesCount: values.length, hasQty });
          } catch (e) {
            console.debug('getPreviousAvailableStock check error', e);
          }
        }),
        catchError(() => of(null))
      )),
      filter((result): result is { date: string; payload: any } => {
        if (result === null) return false;
        const values = result.payload?.values ?? [];
        // Prefer any non-empty values array (treat an existing stock doc as previous stock).
        // This ensures we pick the latest previous stock doc within the lookback window
        // even if individual qty fields are null.
        return values.length > 0;
      }),
      take(1),
      defaultIfEmpty(null)
    );
  }

  buildReport(): void {
    if (this.isLoading) return;
    this.isLoading = true;
    this.isDataLoaded = false;
    this.noDataAvailable = false;
    this.totalAmount = 0;
    this.prevDate = null;
    this.rows = [];

    if (!this.selectedDate || !this.selectedLocation) {
      this.noDataAvailable = true;
      this.isLoading = false;
      this.isDataLoaded = true;
      return;
    }

    const key = this.buildDateKey(this.selectedDate);
    const emptyStockPayload = { dateId: key, itemType: 'stock', values: [], saleAmt: 0, stockAmt: 0 } as any;
    const emptyReceiptPayload = { dateId: key, itemType: 'receipt', values: [], saleAmt: 0, stockAmt: 0 } as any;

    const requestTimeout = 10000;

    const price$ = this.productPriceService.getPrice().pipe(
      timeout(requestTimeout),
      take(1),
      catchError(() => of(null))
    );
    const stock$ = this.stockService.getStock(key).pipe(
      timeout(requestTimeout),
      take(1),
      catchError(() => of(emptyStockPayload))
    );
    const receipt$ = this.receiptService.getReceipts(key).pipe(
      timeout(requestTimeout),
      take(1),
      catchError(() => of(emptyReceiptPayload))
    );
    const prevStock$ = this.getPreviousAvailableStock(this.selectedDate, 4).pipe(
      timeout(requestTimeout),
      catchError(() => of(null))
    );

    forkJoin({ price: price$, stock: stock$, receipt: receipt$, prevStock: prevStock$ }).pipe(
      catchError((error) => {
        console.error('DaySalesReport buildReport catchError:', error);
        this.noDataAvailable = true;
        this.isDataLoaded = true;
        return of({ price: null, stock: emptyStockPayload, receipt: emptyReceiptPayload, prevStock: null });
      }),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: ({ price, stock, receipt, prevStock }) => {
        const products = price?.products ?? [];
        if (!products || products.length === 0) {
          this.noDataAvailable = true;
          this.isDataLoaded = true;
          return;
        }

        this.prevDate = prevStock?.date ?? null;

        const previousStockMap = new Map<number, any>();
        (prevStock?.payload?.values ?? []).forEach((v: any) => {
          const key = v?.item_id ?? v?.seq;
          if (key !== undefined && key !== null) {
            previousStockMap.set(key, v);
          }
        });

        const todayStockMap = new Map<number, any>();
        (stock?.values ?? []).forEach((v: any) => {
          const key = v?.item_id ?? v?.seq;
          if (key !== undefined && key !== null) {
            todayStockMap.set(key, v);
          }
        });

        const receiptMap = new Map<number, any>();
        (receipt?.values ?? []).forEach((v: any) => {
          const key = v?.item_id ?? v?.seq;
          if (key !== undefined && key !== null) {
            receiptMap.set(key, v);
          }
        });

        const hasValue = (value: number | null): boolean => value !== null && value !== undefined;

        this.rows = products.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0)).map((p: Product, idx) => {
          const seqKey = p.seq ?? idx;
          const itemKey = p.item_id ?? seqKey;
          const prevObj = previousStockMap.get(itemKey) ?? previousStockMap.get(seqKey) ?? { qqty: null, pqty: null, nqty: null, dqty: null };
          const currObj = todayStockMap.get(itemKey) ?? todayStockMap.get(seqKey) ?? { qqty: null, pqty: null, nqty: null, dqty: null };
          const recObj = receiptMap.get(itemKey) ?? receiptMap.get(seqKey) ?? { qqty: null, pqty: null, nqty: null, dqty: null };

          const prevQty = { q: prevObj.qqty ?? 0, p: prevObj.pqty ?? 0, n: prevObj.nqty ?? 0, d: prevObj.dqty ?? 0 };
          const receiptQty = { q: recObj.qqty ?? 0, p: recObj.pqty ?? 0, n: recObj.nqty ?? 0, d: recObj.dqty ?? 0 };
          const currQty = { q: currObj.qqty ?? 0, p: currObj.pqty ?? 0, n: currObj.nqty ?? 0, d: currObj.dqty ?? 0 };

          const sales = {
            q: hasValue(prevObj.qqty) || hasValue(recObj.qqty) || hasValue(currObj.qqty) ? prevQty.q + receiptQty.q - currQty.q : null,
            p: hasValue(prevObj.pqty) || hasValue(recObj.pqty) || hasValue(currObj.pqty) ? prevQty.p + receiptQty.p - currQty.p : null,
            n: hasValue(prevObj.nqty) || hasValue(recObj.nqty) || hasValue(currObj.nqty) ? prevQty.n + receiptQty.n - currQty.n : null,
            d: hasValue(prevObj.dqty) || hasValue(recObj.dqty) || hasValue(currObj.dqty) ? prevQty.d + receiptQty.d - currQty.d : null
          };

          const priceQ = this.resolvePriceValue(p.q) ?? 0;
          const priceP = this.resolvePriceValue(p.p) ?? 0;
          const priceN = this.resolvePriceValue(p.n) ?? 0;
          const priceD = this.resolvePriceValue(p.d) ?? 0;

          const amount = (sales.q !== null || sales.p !== null || sales.n !== null || sales.d !== null)
            ? ((sales.q ?? 0) * priceQ)
              + ((sales.p ?? 0) * priceP)
              + ((sales.n ?? 0) * priceN)
              + ((sales.d ?? 0) * priceD)
            : null;

          return {
            seq: seqKey,
            item_id: itemKey,
            name: p.name,
            group: p.group,
            prev: { q: prevObj.qqty ?? null, p: prevObj.pqty ?? null, n: prevObj.nqty ?? null, d: prevObj.dqty ?? null },
            curr: { q: currObj.qqty ?? null, p: currObj.pqty ?? null, n: currObj.nqty ?? null, d: currObj.dqty ?? null },
            sales,
            amount,
            prices: { q: p.q ?? null, p: p.p ?? null, n: p.n ?? null, d: p.d ?? null },
            receipt: { q: recObj.qqty ?? null, p: recObj.pqty ?? null, n: recObj.nqty ?? null, d: recObj.dqty ?? null }
          } as StockSalesRow;
        });

        this.totalAmount = this.rows.reduce((sum, row) => sum + (Number.isFinite(row.amount as any) ? (row.amount || 0) : 0), 0);
        this.isDataLoaded = true;
        this.hasChanges = false;
      },
      error: (error) => {
        console.error('DaySalesReport buildReport unexpected error:', error);
        this.noDataAvailable = true;
        this.rows = [];
        this.totalAmount = 0;
        this.isDataLoaded = true;
      },
      complete: () => {
        console.log('DaySalesReport buildReport complete');
      }
    });
  }

  saveChanges(): void {
    if (this.isSaving) return;
    this.isSaving = true;

    const key = this.appState.getCurrentDateAndLocationKey();
    const values = this.rows.map(r => ({ seq: r.seq, qqty: r.curr.q ?? null, pqty: r.curr.p ?? null, nqty: r.curr.n ?? null, dqty: r.curr.d ?? null }));
    const payload: StockPayload = { dateId: key, itemType: 'stock', values, saleAmt: 0, stockAmt: 0 };

    this.stockService.saveStock(payload).pipe(take(1)).subscribe(ok => {
      this.saveStatus = { type: ok ? 'success' : 'error', message: ok ? 'Report saved successfully.' : 'Failed to save report.' };
      this.hasChanges = false;
      this.isSaving = false;
    }, () => {
      this.saveStatus = { type: 'error', message: 'Failed to save report.' };
      this.isSaving = false;
    });
  }
}

// If you see an error for 'lodash-es', run: npm install lodash-es
