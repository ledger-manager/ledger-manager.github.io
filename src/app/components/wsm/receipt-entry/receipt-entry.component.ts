import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AbstractControl, FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { Product } from '../models/product.model';
import { Subscription, combineLatest, take, skip, finalize } from 'rxjs';
import { AppStateService } from '../services/app-state.service';
import { ReceiptService } from '../services/receipt.service';
import { ProductPriceService } from '../services/product-price.service';
import { ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-receipt-entry',
  templateUrl: './receipt-entry.component.html',
  styleUrls: ['./receipt-entry.component.scss'],
  styles: ["@import '../shared-styles.scss';"],
  standalone: true,
  imports: [ReactiveFormsModule, TableModule, ButtonModule, CommonModule]
})
export class ReceiptEntryComponent implements OnInit, OnDestroy {
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

    private getProductIdentity(product: Product, fallbackIndex: number): number {
      return product.item_id ?? product.seq ?? fallbackIndex + 1;
    }

    private getPriceValue(value: any): number | null {
      if (value === null || value === undefined) return null;
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
      }
      if (typeof value === 'object') {
        for (const key of Object.keys(value)) {
          const nested = this.getPriceValue((value as Record<string, unknown>)[key]);
          if (nested !== null) {
            return nested;
          }
        }
      }
      return null;
    }

    loadData(): void {
      if (this.isLoading || this.isDataLoaded) return;
      this.isLoading = true;
      this.isDataLoaded = false;

      const key = this.appState.getCurrentDateAndLocationKey();
      this.productService.getPrice().pipe(take(1)).subscribe(price => {
        const products = price?.products ?? [];
        this.productMap.clear();
        products.forEach((p, index) => {
          const itemId = this.getProductIdentity(p, index);
          this.productMap.set(itemId, p);
        });

        this.receiptService.getReceipts(key).pipe(
          take(1),
          finalize(() => {
            this.isLoading = false;
            this.cdr.markForCheck();
          })
        ).subscribe(payload => {
          const rows = this.form.get('rows') as FormArray;
          rows.clear();

          const savedMap = new Map<number, any>();
          (payload?.values || []).forEach((v: any) => {
            const key = v?.item_id ?? v?.seq;
            if (key !== undefined && key !== null) {
              savedMap.set(key, v);
            }
          });

          const sortedProducts = [...products].sort((a,b) => (a.seq ?? 0) - (b.seq ?? 0));
          const seenSeq = new Set<number>();

          sortedProducts.forEach((p, index) => {
            const seq = p.seq ?? index;
            const itemId = this.getProductIdentity(p, index);
            if (seenSeq.has(seq)) {
              return;
            }
            seenSeq.add(seq);

            const savedValue = savedMap.get(itemId) ?? savedMap.get(seq);
            const qDisabled = this.getPriceValue(p.q) === null;
            const pDisabled = this.getPriceValue(p.p) === null;
            const nDisabled = this.getPriceValue(p.n) === null;
            const dDisabled = this.getPriceValue(p.d) === null;

            rows.push(this.fb.group({
              seq: [seq],
              item_id: [itemId],
              name: [p.name],
              group: [p.group],
              qqty: [{ value: savedValue?.qqty ?? null, disabled: qDisabled }],
              pqty: [{ value: savedValue?.pqty ?? null, disabled: pDisabled }],
              nqty: [{ value: savedValue?.nqty ?? null, disabled: nDisabled }],
              dqty: [{ value: savedValue?.dqty ?? null, disabled: dDisabled }]
            }));
          });

          this.isDataLoaded = true;
          this.savedMessage = null;
        }, (error) => {
          console.error('Receipt load error', error);
          const rows = this.form.get('rows') as FormArray;
          rows.clear();
          const sortedProducts = [...products].sort((a,b) => (a.seq ?? 0) - (b.seq ?? 0));
          const seenSeq = new Set<number>();

          sortedProducts.forEach((p, index) => {
            const seq = p.seq ?? index;
            const itemId = this.getProductIdentity(p, index);
            if (seenSeq.has(seq)) {
              return;
            }
            seenSeq.add(seq);

            const qDisabled = this.getPriceValue(p.q) === null;
            const pDisabled = this.getPriceValue(p.p) === null;
            const nDisabled = this.getPriceValue(p.n) === null;
            const dDisabled = this.getPriceValue(p.d) === null;

            rows.push(this.fb.group({
              seq: [seq],
              item_id: [itemId],
              name: [p.name],
              group: [p.group],
              qqty: [{ value: null, disabled: qDisabled }],
              pqty: [{ value: null, disabled: pDisabled }],
              nqty: [{ value: null, disabled: nDisabled }],
              dqty: [{ value: null, disabled: dDisabled }]
            }));
          });
          this.isDataLoaded = true;
        });
      }, (error) => {
        console.error('Price load error', error);
        this.isLoading = false;
        this.cdr.markForCheck();
      });
    }

    save(): void {
      if (this.isSaving) return;
      this.isSaving = true;
      const key = this.appState.getCurrentDateAndLocationKey();
      const rows = this.form.get('rows') as FormArray;
      const values = rows.controls.map(g => ({
        seq: g.get('seq')?.value,
        item_id: g.get('item_id')?.value ?? g.get('seq')?.value,
        qqty: g.get('qqty')?.value ?? null,
        pqty: g.get('pqty')?.value ?? null,
        nqty: g.get('nqty')?.value ?? null,
        dqty: g.get('dqty')?.value ?? null
      }));
      const payload = { dateId: key, itemType: 'receipt', values, saleAmt: 0, stockAmt: 0 };
      this.receiptService.saveReceipts(payload as any).pipe(take(1)).subscribe(ok => {
        this.isSaving = false;
        this.savedMessage = ok ? 'Receipts saved successfully.' : 'Failed to save receipts.';
        this.hasChanges = false;
      }, () => {
        this.isSaving = false;
        this.savedMessage = 'Failed to save receipts.';
      });
    }

    onNumberInput(i: number, field: string, value: string): void {
      const num = value === null || value === undefined || value === '' ? null : Number(value);
      const rows = this.form.get('rows') as FormArray;
      const group = rows.at(i) as FormGroup;
      if (!group) return;
      group.get(field)?.setValue(num);
      this.hasChanges = true;
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

    hasPreviousDate(): boolean {
      return !!this.selectedDate;
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

    trackBySeq(index: number, row: AbstractControl): number {
      return row.get('item_id')?.value ?? row.get('seq')?.value ?? index;
    }

    get rows(): FormArray {
      return this.form.get('rows') as FormArray;
    }
  form: FormGroup;
  savedMessage: string | null = null;
  private msgTimer: any = null;
  isDataLoaded = false;
  isLoading = false;
  isSaving = false;
  isCopying = false;
  copyProgress: string | null = null;
  hasChanges = false;

  private productMap = new Map<number, Product>();
  private readonly AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes

  selectedDate: string | null = null;
  selectedLocation: string | null = null;
  private subs = new Subscription();

  constructor(
    private fb: FormBuilder,
    private appState: AppStateService,
    private receiptService: ReceiptService,
    private productService: ProductPriceService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.form = this.fb.group({ rows: this.fb.array([]) });
  }

  ngOnInit(): void {
    this.subs.add(combineLatest([this.appState.selectedDate$, this.appState.location$]).pipe(take(1)).subscribe(([date, location]) => {
      this.selectedDate = date;
      this.selectedLocation = location;
      this.loadData();
    }));

    // Keep selectedDate updated and reset rows only on subsequent changes.
    this.subs.add(this.appState.selectedDate$.pipe(skip(1)).subscribe((date: string) => {
      if (this.selectedDate !== date) {
        const wasLoaded = this.isDataLoaded;
        this.selectedDate = date;
        this.resetState();
        if (wasLoaded) {
          this.loadData();
        }
      }
    }));

    this.subs.add(this.appState.location$.pipe(skip(1)).subscribe((location: string) => {
      if (this.selectedLocation !== location) {
        this.selectedLocation = location;
        this.resetState();
      }
    }));

    this.setupAutoSave();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.msgTimer) {
      clearTimeout(this.msgTimer);
    }
  }

  resetState(): void {
    (this.form.get('rows') as FormArray)?.clear();
    this.isDataLoaded = false;
    this.isLoading = false;
    this.isSaving = false;
    this.isCopying = false;
    this.copyProgress = null;
    this.hasChanges = false;
    this.savedMessage = null;
  }

  setupAutoSave(): void {
    // No-op for now; explicit save preferred. Could be extended to auto-save when hasChanges is true.
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
