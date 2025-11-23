import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StockVal } from '../models/stock-val.model';
import { Product } from '../models/product.model';
import { Subscription, switchMap, take, finalize, timer, tap } from 'rxjs';
import { AppStateService } from '../services/app-state.service';
import { ReceiptService } from '../services/receipt.service';
import { ProductPriceService } from '../services/product-price.service';
import { StockPayload } from '../models/stock-payload.model';
import { CouchSyncService } from '../services/couch-sync.service';
import { CouchDataService } from '../services/couch-data.service';
import { ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-receipt-entry',
  templateUrl: './receipt-entry.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, TableModule, CommonModule]
})
export class ReceiptEntryComponent implements OnInit, OnDestroy {
    formatDisplayDate(date: string | null): string {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    copyDataToCouch(): void {
      // TODO: Implement copy logic
    }

    loadData(): void {
      // TODO: Implement load logic
    }

    save(): void {
      // TODO: Implement save logic
    }

    onNumberInput(i: number, field: string, value: string): void {
      // TODO: Implement number input logic
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
    private couchSync: CouchSyncService,
    private couchData: CouchDataService
  ) {
    this.form = this.fb.group({ rows: this.fb.array([]) });
  }

  ngOnInit(): void {
    // Keep selectedDate updated, but don't load data automatically.
    this.subs.add(this.appState.selectedDate$.subscribe((date: string) => {
      if (this.selectedDate !== date) {
        this.selectedDate = date;
        this.resetState();
      }
    }));

    // Also listen for location changes to reset the view.
    this.subs.add(this.appState.location$.subscribe((location: string) => {
      this.selectedLocation = location;
      this.resetState();
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
    // TODO: Implement reset logic
  }

  setupAutoSave(): void {
    // TODO: Implement auto-save logic
  }
  }
