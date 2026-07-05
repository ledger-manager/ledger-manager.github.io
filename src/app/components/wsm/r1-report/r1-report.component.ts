import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError, defaultIfEmpty, switchMap, map, take }from 'rxjs/operators';

import { AppStateService } from '../services/app-state.service';
import { StockService } from '../services/stock.service';
import { ProductPriceService } from '../services/product-price.service';
import { ReceiptService } from '../services/receipt.service';
import { ItemBinLookupService } from '../services/item-bin-lookup.service';
import { PdfExportService } from '../services/pdf-export.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';

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
  imports: [CommonModule, TableModule, ButtonModule]
})
export class R1ReportComponent implements OnInit, OnDestroy {
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
    private pdfExportService: PdfExportService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const dateSub = this.appState.selectedDate$.subscribe((date: string) => {
      if (this.selectedDate !== date) {
        const wasLoaded = this.isDataLoaded;
        this.selectedDate = date;
        this.isDataLoaded = false;
        if (wasLoaded) {
          this.buildReport();
        }
      }
    });
    this.sub = dateSub;
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

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
