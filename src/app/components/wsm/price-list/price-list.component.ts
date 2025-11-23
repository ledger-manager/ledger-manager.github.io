import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProductPrice } from '../models/product-list.model';
import { Product } from '../models/product.model';
import { Router } from '@angular/router';
import { Subscription, take, finalize } from 'rxjs';
import { AppStateService } from '../services/app-state.service';
import { ProductPriceService } from '../services/product-price.service';
import { CouchSyncService } from '../services/couch-sync.service';
import { CouchDataService } from '../services/couch-data.service';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-price-list',
  templateUrl: './price-list.component.html',
  standalone: true,
  imports: [TableModule]
})
export class PriceListComponent implements OnInit, OnDestroy {
      copyDataToCouch(): void {
        // TODO: Implement copy logic
        this.isCopying = true;
        this.copyProgress = 'Copying data to CouchDB...';
        setTimeout(() => {
          this.isCopying = false;
          this.copyProgress = 'Copy complete!';
        }, 1500);
      }
    get sortedProducts(): Product[] {
      return [...this.products].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
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
  selectedDate: string | null = null;
  selectedLocation: string | null = null;
  isDataLoaded = false;
  isLoading = false;
  isCopying = false;
  copyProgress: string | null = null;
  private subs = new Subscription();

  constructor(
    private router: Router,
    private appState: AppStateService,
    private productService: ProductPriceService,
    private couchSync: CouchSyncService,
    private couchData: CouchDataService
  ) {}

  ngOnInit(): void {
    this.subs.add(this.appState.selectedDate$.subscribe(date => {
      if (this.selectedDate !== date) {
        this.selectedDate = date;
        this.isDataLoaded = false; // Reset on date change
      }
    }));

    this.subs.add(this.appState.location$.subscribe(location => {
      this.selectedLocation = location;
      this.isDataLoaded = false; // Reset on location change
    }));
  }

  loadData(): void {
    if (this.isDataLoaded || this.isLoading) return;

    this.isLoading = true;
    this.isDataLoaded = false;

    // Load from CouchDB instead of JSONBin
    this.couchData.getPrice().pipe(
      take(1),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (priceList: any) => {
        this.products = priceList?.products ?? [];
      }
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
