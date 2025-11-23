import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { AppStateService } from '../services/app-state.service';
import { ProductPriceService } from '../services/product-price.service';
import { StockService } from '../services/stock.service';
import { ReceiptService } from '../services/receipt.service';
import { StockPayload } from '../models/stock-payload.model';
import { PdfExportService } from '../services/pdf-export.service';
import { cloneDeep, isEqual } from 'lodash-es';
import { Subscription } from 'rxjs';
import { Product } from '../models/product.model';
import { ItemBinLookupService } from '../services/item-bin-lookup.service';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';

interface StockSalesRow {
  seq: number;
  name: string;
  prev: { q: number | null; p: number | null; n: number | null; d: number | null };
  curr: { q: number | null; p: number | null; n: number | null; d: number | null };
  sales: { q: number; p: number; n: number; d: number };
  amount: number;
  prices: { q: number | null; p: number | null; n: number | null; d: number | null };
  receipt: { q: number | null; p: number | null; n: number | null; d: number | null };
}

@Component({
  selector: 'app-day-sales-report',
  templateUrl: './day-sales-report.component.html',
  standalone: true,
  imports: [TableModule, CommonModule]
})

export class DaySalesReportComponent implements OnInit, OnDestroy {
  selectedDate: string | null = null;
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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // TODO: Add initialization logic
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  formatDisplayDate(date: string | null): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatHeaderDate(date: string | null): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  buildReport(): void {
    // TODO: Implement report building logic
  }

  saveChanges(): void {
    // TODO: Implement save logic
    this.saveStatus = { type: 'success', message: 'Report saved successfully.' };
    this.hasChanges = false;
  }
}

// If you see an error for 'lodash-es', run: npm install lodash-es
