import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ProductPrice } from '../models/product-list.model';
import { Product } from '../models/product.model';
import { Router } from '@angular/router';
import { Subscription, combineLatest, take, finalize, skip } from 'rxjs';
import { AppStateService } from '../services/app-state.service';
import { ProductPriceService } from '../services/product-price.service';
import { CouchDataService } from '../services/couch-data.service';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-price-list',
  templateUrl: './price-list.component.html',
  standalone: true,
  imports: [TableModule, ButtonModule, CommonModule, FormsModule]
})
export class PriceListComponent implements OnInit, OnDestroy {
    get sortedProducts(): Product[] {
      // Keep the current edit order stable while editing; seq is still stored and used
      // by stock/receipt/day-report flows, but it should not re-sort this page on every change.
      return [...this.editableProducts];
    }

    displayVal(val: any): string {
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') {
        return Object.values(val).filter(v => v !== null && v !== undefined).join(', ');
      }
      return val.toString();
    }
  // keep the original list but expose a sorted view by seq
  products: Product[] = [];
  editableProducts: Product[] = [];
  selectedDate: string | null = null;
  selectedLocation: string | null = null;
  isDataLoaded = false;
  isLoading = false;
  isCopying = false;
  isSaving = false;
  saveMessage: string | null = null;
  copyProgress: string | null = null;
  private subs = new Subscription();

  constructor(
    private router: Router,
    private appState: AppStateService,
    private productService: ProductPriceService,
    private couchData: CouchDataService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subs.add(combineLatest([this.appState.selectedDate$, this.appState.location$]).pipe(take(1)).subscribe(([date, location]) => {
      this.selectedDate = date;
      this.selectedLocation = location;
      this.loadData();
    }));

    this.subs.add(combineLatest([this.appState.selectedDate$, this.appState.location$]).pipe(skip(1)).subscribe(([date, location]) => {
      if (this.selectedDate !== date || this.selectedLocation !== location) {
        this.selectedDate = date;
        this.selectedLocation = location;
        this.isDataLoaded = false;
        this.loadData();
      }
    }));
  }

  private normalizePriceValue(value: any): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    if (typeof value === 'object') {
      for (const key of Object.keys(value)) {
        const nested = this.normalizePriceValue((value as Record<string, unknown>)[key]);
        if (nested !== null) {
          return nested;
        }
      }
    }
    return null;
  }

  private getProductIdentity(product: Product, fallbackIndex: number): number {
    return product.item_id ?? product.seq ?? fallbackIndex + 1;
  }

  private getNextItemId(): number {
    const existingIds = this.editableProducts.map((item, index) => this.getProductIdentity(item, index));
    const maxId = existingIds.reduce((max, value) => Math.max(max, value), 0);
    return maxId + 1;
  }

  private normalizeProduct(product: Product, index: number): Product {
    const row = new Product(product);
    row.active = row.active ?? true;
    row.q = this.normalizePriceValue((product as any)?.q?.p ?? (product as any)?.q);
    row.p = this.normalizePriceValue((product as any)?.p?.p ?? (product as any)?.p);
    row.n = this.normalizePriceValue((product as any)?.n?.p ?? (product as any)?.n);
    row.d = this.normalizePriceValue((product as any)?.d?.p ?? (product as any)?.d);
    if (row.seq === null || row.seq === undefined) {
      row.seq = index + 1;
    }
    row.item_id = product.item_id ?? row.seq ?? index + 1;
    return row;
  }

  loadData(): void {
    if (this.isLoading) return;

    this.isLoading = true;
    this.isDataLoaded = false;

    // Load from CouchDB instead of JSONBin
    this.couchData.getPrice().pipe(
      take(1),
      finalize(() => {
        this.isLoading = false;
        console.log('PriceListComponent: loadData finalize, isLoading=false');
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (priceList: any) => {
        console.log('PriceListComponent: getPrice next', priceList);
        this.products = Array.isArray(priceList?.products) ? priceList.products : [];
        this.editableProducts = this.products.map((product: Product, index: number) => this.normalizeProduct(product, index));
        this.isDataLoaded = true;
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        console.error('Price list load failed', error);
        this.products = [];
        this.isDataLoaded = false;
        this.cdr.markForCheck();
      }
    });
  }

  addRow(): void {
    const nextSeq = this.editableProducts.reduce((max, item) => Math.max(max, item.seq ?? 0), 0) + 1;
    const nextItemId = this.getNextItemId();
    this.editableProducts.push(new Product({
      name: '',
      seq: nextSeq,
      item_id: nextItemId,
      group: 'Liquor',
      q: null,
      p: null,
      n: null,
      d: null,
      active: true
    }));
    this.products = [...this.editableProducts];
  }

  toggleActive(product: Product): void {
    product.active = !(product.active ?? true);
  }

  saveChanges(): void {
    this.isSaving = true;
    this.saveMessage = null;

    const payload: ProductPrice = {
      effDate: this.selectedDate ? this.selectedDate.replace(/-/g, '') : '',
      itemType: 'products',
      products: this.editableProducts.map((product, index) => ({
        ...product,
        seq: product.seq ?? index + 1,
        item_id: product.item_id ?? product.seq ?? index + 1,
        group: product.group || 'Liquor',
        active: product.active ?? true,
        q: { p: product.q ?? null },
        p: { p: product.p ?? null },
        n: { p: product.n ?? null },
        d: { p: product.d ?? null }
      })),
      saleAmt: 0,
      stockAmt: 0
    };

    this.couchData.savePrice(payload).pipe(take(1)).subscribe({
      next: (ok: boolean) => {
        this.isSaving = false;
        this.saveMessage = ok ? 'Price list saved successfully.' : 'Failed to save price list.';
        this.cdr.markForCheck();
      },
      error: () => {
        this.isSaving = false;
        this.saveMessage = 'Failed to save price list.';
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  formatDisplayDate(date: string | null): string {
    if (!date) {
      return 'No date selected';
    }
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
