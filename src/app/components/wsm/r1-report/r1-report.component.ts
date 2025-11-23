import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError, defaultIfEmpty, switchMap, map, take }from 'rxjs/operators';

import { AppStateService } from '../services/app-state.service';
import { StockService } from '../services/stock.service';
import { ProductPriceService } from '../services/product-price.service';
import { ReceiptService } from '../services/receipt.service';
import { ItemBinLookupService } from '../services/item-bin-lookup.service';
import { PdfExportService } from '../services/pdf-export.service';
import { TableModule } from 'primeng/table';

interface ReportRow {
  type: string;
  prev: number | null;
  receipt: number | null;
  sales: number | null;
  curr: number | null;
}

interface ReportSummary {
  prev: any;
  receipt: any;
  sales: any;
  curr: any;
}

@Component({
  selector: 'app-r1-report',
  templateUrl: './r1-report.component.html',
  styleUrls: ['./r1-report.component.css'],
  standalone: true,
  imports: [TableModule]
})
export class R1ReportComponent implements OnInit, OnDestroy {
    formatDisplayDate(date: string | null): string {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    buildReport(): void {
      // TODO: Implement report building logic
    }

    displayVal(val: any): string {
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') {
        return Object.values(val).filter(v => v !== null && v !== undefined).join(', ');
      }
      return val.toString();
    }

    exportAsPdf(): void {
      // TODO: Implement PDF export logic
    }
  selectedDate: string | null = null;
  prevDate: string | null = null;
  rows: ReportRow[] = [];
  isDataLoaded = false;
  isLoading = false;
  noDataAvailable = false;

  private reportSummary: ReportSummary | null = null;
  private sub: Subscription | null = null;

  constructor(
    private appState: AppStateService,
    private stockService: StockService,
    private productService: ProductPriceService,
    private receiptService: ReceiptService,
    private lookupService: ItemBinLookupService,
    private cd: ChangeDetectorRef,
    private pdfExportService: PdfExportService
  ) {}

  ngOnInit(): void {
    const dateSub = this.appState.selectedDate$.subscribe((date: string) => {
      if (this.selectedDate !== date) {
        this.selectedDate = date;
        this.isDataLoaded = false;
      }
    });
    this.sub = dateSub;
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}
