import { Component, OnInit, OnDestroy, signal, computed, effect, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { take } from 'rxjs/operators';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';

import { LedgerService } from '../../../services/ledger.service'; 
import { LedgerDataService } from '../../../services/ledger-data.service';
import { DataExportService } from '../../../services/data-export.service';
import { MemberData } from '../model/member-data.model';
import { TenDayLedger,LedgerDayRecord, CustDayRecord, MilkRecord } from '../model/ledger-day.model';
import { getCurrentPeriodStart } from '../model/sample-ledger-data';

interface TableRow {
  custNo: number;
  name_en: string;
  name_tel: string;
  village: string;
  dayRecords: Map<string, CustDayRecord>; // key: date string
}

@Component({
  selector: 'app-payment-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    SelectButtonModule,
    ButtonModule,
    ToastModule,
    DialogModule
  ],
  providers: [MessageService],
  templateUrl: './payment-report.html',
  styleUrls: ['./payment-report.scss']
})
export class PaymentReport implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('tableWrapper') tableWrapper?: ElementRef<HTMLDivElement>;
  
  members = signal<MemberData[]>([]);
  ledgerData = signal<TenDayLedger | null>(null);
  tableRows = signal<TableRow[]>([]);
  
  nameDisplayOptions = [
    { label: 'en', value: 'en' },
    { label: 'tel', value: 'tel' }
  ];
  selectedNameDisplay = signal('en');
  
  sessionDisplayOptions = [
    { label: 'AM', value: 'AM' },
    { label: 'PM', value: 'PM' },
    { label: 'AM-PM', value: 'AM-PM' }
  ];
  selectedSessionDisplay = signal('AM-PM');
  
  dateRangeOptions = [
    { label: 'Day', value: 'DAY' },
    { label: '10 Day', value: 'TEN_DAY' }
  ];
  selectedDateRange = signal('DAY');
  
  entryModeOptions = [
    { label: 'Single', value: 'SINGLE' },
    { label: 'Bulk', value: 'BULK' }
  ];
  selectedEntryMode = signal('SINGLE');
  
  exportFormatOptions = [
    { label: 'PDF', value: 'PDF' }
  ];
  selectedExportFormat = signal<'PDF'>('PDF');
  
  // Dialog state
  showEntryDialog = signal(false);
  dialogMember = signal<MemberData | null>(null);
  dialogDate = signal<string>('');
  dialogData = signal<{ AM: MilkRecord, PM: MilkRecord }>({
    AM: { qty: 0, fat: 0 },
    PM: { qty: 0, fat: 0 }
  });
  
  // Determine if current time is AM or PM
  currentSession = signal<'AM' | 'PM'>(new Date().getHours() < 12 ? 'AM' : 'PM');
  currentDateStr = signal(this.getDateString(new Date()));
  
  // Auto-save interval
  private autoSaveInterval?: number;
  private hasUnsavedChanges = false;
  private isInitialLoad = true;
  
  // All unique dates from ledger data
  allDates = computed(() => {
    const dates = new Set<string>();
    const tenDay = this.ledgerData();
    if (tenDay) {
      tenDay.records.forEach(dayRecord => {
        dates.add(this.getDateString(dayRecord.day));
      });
    }
    return Array.from(dates).sort();
  });

  // Show dates based on selection: single day or all days from TEN_DAY_DATA
  visibleDates = computed(() => {
    if (this.selectedDateRange() === 'DAY') {
      return [this.currentDateStr()];
    } else {
      return this.allDates();
    }
  });

  constructor(
    private ledgerService: LedgerService, 
    private ledgerDataService: LedgerDataService,
    private dataExportService: DataExportService,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Watch for changes in signals and update URL
    effect(() => {
      // Track these signals
      this.selectedDateRange();
      this.selectedSessionDisplay();
      this.selectedEntryMode();
      this.currentDateStr();
      
      // Update URL when any of these change (but skip during initial load)
      if (!this.isInitialLoad) {
        this.updateUrlParams();
      }
    });
  }

  ngOnInit(): void {
    // Initialize from URL query params or use defaults (only once on init)
    this.route.queryParams.pipe(take(1)).subscribe(params => {
      // Date Range
      const dateRange = params['dateRange'];
      if (dateRange === 'DAY' || dateRange === 'TEN_DAY') {
        this.selectedDateRange.set(dateRange);
      }
      
      // Session Display
      const session = params['session'];
      if (session === 'AM' || session === 'PM' || session === 'AM-PM') {
        this.selectedSessionDisplay.set(session);
      }
      
      // Entry Mode
      const mode = params['mode'];
      if (mode === 'SINGLE' || mode === 'BULK') {
        this.selectedEntryMode.set(mode);
      }
      
      // Specific date or period
      const dateParam = params['date'];
      let periodParam = params['period'];
      
      // For TEN_DAY mode, validate the period parameter
      if (this.selectedDateRange() === 'TEN_DAY' && periodParam) {
        // Check if period is valid (1st, 11th, or 21st)
        const [year, month, day] = periodParam.split('-').map(Number);
        if (day !== 1 && day !== 11 && day !== 21) {
          // Invalid period start, use current period instead
          periodParam = undefined;
        }
      }
      
      if (this.selectedDateRange() === 'DAY' && dateParam) {
        // Set current date from URL
        this.currentDateStr.set(dateParam);
      }
      
      // Note: For TEN_DAY mode with period, we'll use it when loading data
      
      // Load members and data
      this.ledgerService.getMembers().subscribe(members => {
        this.members.set(members);
        this.loadLedgerData(periodParam);
      });
    });
    
    // Set up auto-save every 5 minutes
    this.autoSaveInterval = window.setInterval(() => {
      if (this.hasUnsavedChanges) {
        this.saveLedgerData(true); // true = auto-save
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  ngAfterViewInit(): void {
    // No need to scroll since we only show 2 recent days
  }
  
  ngOnDestroy(): void {
    // Clean up auto-save interval
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
  }

  private loadLedgerData(periodParam?: string): void {
    let periodStart: Date;
    
    if (periodParam) {
      // Parse date from URL (format: YYYY-MM-DD)
      // Create date at midnight local time to avoid timezone issues
      const [year, month, day] = periodParam.split('-').map(Number);
      periodStart = new Date(year, month - 1, day); // month is 0-indexed
      periodStart.setHours(0, 0, 0, 0);
    } else {
      // Use current billing period
      periodStart = getCurrentPeriodStart();
    }
    
    this.ledgerDataService.getBillingPeriodData(periodStart).subscribe(data => {
      this.ledgerData.set(data);
      this.buildTableRows();
      
      // Update URL if not set and mark initial load complete
      if (this.isInitialLoad) {
        this.updateUrlParams();
        this.isInitialLoad = false;
      }
    });
  }

  private buildTableRows(): void {
    const rows: TableRow[] = [];
    const ledgerMap = new Map<number, Map<string, CustDayRecord>>();
    const tenDay = this.ledgerData();

    if (tenDay) {
      tenDay.records.forEach(dayRecord => {
        const dateStr = this.getDateString(dayRecord.day);
        dayRecord.quantities.forEach(custRecord => {
          if (!ledgerMap.has(custRecord.custNo)) {
            ledgerMap.set(custRecord.custNo, new Map());
          }
          ledgerMap.get(custRecord.custNo)!.set(dateStr, custRecord);
        });
      });
    }

    this.members().forEach(member => {
      const dayRecords = ledgerMap.get(member.custNo) || new Map();

      this.allDates().forEach(dateStr => {
        if (!dayRecords.has(dateStr)) {
          dayRecords.set(dateStr, {
            custNo: member.custNo,
            AM: { qty: 0, fat: 0 },
            PM: { qty: 0, fat: 0 }
          });
        }
      });

      rows.push({
        custNo: member.custNo,
        name_en: member.name_en,
        name_tel: member.name_tel,
        village: member.village,
        dayRecords
      });
    });

    this.tableRows.set(rows);
  }

  private getDateString(date: Date): string {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private updateUrlParams(): void {
    const queryParams: any = {
      dateRange: this.selectedDateRange(),
      session: this.selectedSessionDisplay(),
      mode: this.selectedEntryMode()
    };
    
    if (this.selectedDateRange() === 'DAY') {
      queryParams.date = this.currentDateStr();
    } else {
      const tenDay = this.ledgerData();
      if (tenDay) {
        queryParams.period = this.getDateString(tenDay.tenDayStart);
      }
    }
    
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true
    });
  }

  getDateDisplay(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}`;
  }

  getDateColspan(): number {
    const session = this.selectedSessionDisplay();
    return session === 'AM-PM' ? 4 : 2;
  }

  // Get grouped dates by 10-day period
  getTenDayPeriods(): Array<{ tenDayStart: Date, dates: string[] }> {
    const tenDay = this.ledgerData();
    if (!tenDay) {
      return [];
    }

    const periodDates: string[] = [];
    tenDay.records.forEach(dayRecord => {
      const dateStr = this.getDateString(dayRecord.day);
      if (this.visibleDates().includes(dateStr)) {
        periodDates.push(dateStr);
      }
    });

    if (periodDates.length > 0) {
      return [{
        tenDayStart: tenDay.tenDayStart,
        dates: periodDates.sort()
      }];
    }

    return [];
  }

  getPeriodDateRange(period: { tenDayStart: Date, dates: string[] }): string {
    if (period.dates.length === 0) return '';
    
    const startDate = this.getDateDisplay(this.getDateString(period.tenDayStart));
    const endDate = this.getDateDisplay(period.dates[period.dates.length - 1]);
    
    return `${startDate} - ${endDate}`;
  }

  getPeriodColspan(period: { tenDayStart: Date, dates: string[] }): number {
    return period.dates.length * this.getDateColspan();
  }

  isInPeriod(dateStr: string, period: { tenDayStart: Date, dates: string[] }): boolean {
    return period.dates.includes(dateStr);
  }

  isEditable(dateStr: string, session: 'AM' | 'PM'): boolean {
    return false; // All columns in view mode
  }

  getRecord(row: TableRow, dateStr: string): CustDayRecord | undefined {
    return row.dayRecords.get(dateStr);
  }

  goToToday(): void {
    const todayStr = this.currentDateStr();
    
    // Switch to Day mode
    this.selectedDateRange.set('DAY');
    
    // Check if today's data exists in ledger
    const tenDay = this.ledgerData();
    const todayExists = tenDay?.records.some(dayRecord => 
      this.getDateString(dayRecord.day) === todayStr
    );
    
    if (!todayExists) {
      // Create empty records for today if it doesn't exist
      this.ensureTodayRecordsExist();
    }
    
    // Show toast message
    this.messageService.add({
      severity: 'info',
      summary: 'Today\'s Data',
      detail: `Showing data for ${this.getDateDisplay(todayStr)}`,
      life: 10000
    });
  }

  private ensureTodayRecordsExist(): void {
    const todayStr = this.currentDateStr();
    const tenDay = this.ledgerData();
    
    if (!tenDay) return;
    
    // Check if today's record already exists
    const todayRecordExists = tenDay.records.some(dayRecord => 
      this.getDateString(dayRecord.day) === todayStr
    );
    
    if (!todayRecordExists) {
      // Create empty ledger day record for today
      const todayDate = new Date();
      const emptyDayRecord: LedgerDayRecord = {
        day: todayDate,
        quantities: this.members().map(member => ({
          custNo: member.custNo,
          AM: { qty: 0, fat: 0 },
          PM: { qty: 0, fat: 0 }
        }))
      };
      
      // Add to ledger data
      tenDay.records.push(emptyDayRecord);
      this.ledgerData.set({ ...tenDay });
      
      // Rebuild table rows
      this.buildTableRows();
    }
  }

  openEntryDialog(row: TableRow): void {
    // Only open in Single mode
    if (this.selectedEntryMode() !== 'SINGLE') {
      return;
    }

    // Get member data
    const member = this.members().find(m => m.custNo === row.custNo);
    if (!member) return;

    // Use current date being viewed
    const dateStr = this.currentDateStr();
    
    // Get existing data for this member and date
    const existingRecord = row.dayRecords.get(dateStr);
    
    // Populate dialog data - use actual values or 0 for blank display
    this.dialogMember.set(member);
    this.dialogDate.set(dateStr);
    this.dialogData.set({
      AM: existingRecord?.AM ? { 
        qty: existingRecord.AM.qty || 0, 
        fat: existingRecord.AM.fat || 0 
      } : { qty: 0, fat: 0 },
      PM: existingRecord?.PM ? { 
        qty: existingRecord.PM.qty || 0, 
        fat: existingRecord.PM.fat || 0 
      } : { qty: 0, fat: 0 }
    });
    
    this.showEntryDialog.set(true);
  }

  saveDialogData(): void {
    const member = this.dialogMember();
    const dateStr = this.dialogDate();
    const data = this.dialogData();
    
    if (!member) return;

    const tenDay = this.ledgerData();
    if (!tenDay) return;

    // Find or create the day record
    let dayRecord = tenDay.records.find(r => this.getDateString(r.day) === dateStr);
    
    if (!dayRecord) {
      // Create new day record
      const date = new Date(dateStr);
      dayRecord = {
        day: date,
        quantities: []
      };
      tenDay.records.push(dayRecord);
    }

    // Find or create customer record in quantities
    let custRecord = dayRecord.quantities.find(q => q.custNo === member.custNo);
    
    if (custRecord) {
      // Update existing record - use null for zero values
      custRecord.AM = {
        qty: data.AM.qty || 0,
        fat: data.AM.fat || 0
      };
      custRecord.PM = {
        qty: data.PM.qty || 0,
        fat: data.PM.fat || 0
      };
    } else {
      // Add new customer record
      dayRecord.quantities.push({
        custNo: member.custNo,
        AM: {
          qty: data.AM.qty || 0,
          fat: data.AM.fat || 0
        },
        PM: {
          qty: data.PM.qty || 0,
          fat: data.PM.fat || 0
        }
      });
    }

    // Update ledger data
    this.ledgerData.set({ ...tenDay });
    this.buildTableRows();
    
    // Close dialog
    this.showEntryDialog.set(false);
    
    // Show success message
    this.messageService.add({
      severity: 'success',
      summary: 'Saved',
      detail: `Entry saved for ${member.name_en}`,
      life: 3000
    });
  }

  clearDialogData(): void {
    const member = this.dialogMember();
    const dateStr = this.dialogDate();
    
    if (!member) return;

    const tenDay = this.ledgerData();
    if (!tenDay) return;

    // Find the day record
    const dayRecord = tenDay.records.find(r => this.getDateString(r.day) === dateStr);
    
    if (dayRecord) {
      // Find customer record and remove or set to zeros
      const custIndex = dayRecord.quantities.findIndex(q => q.custNo === member.custNo);
      if (custIndex !== -1) {
        dayRecord.quantities[custIndex] = {
          custNo: member.custNo,
          AM: { qty: 0, fat: 0 },
          PM: { qty: 0, fat: 0 }
        };
      }
    }

    // Update ledger data
    this.ledgerData.set({ ...tenDay });
    this.buildTableRows();
    
    // Close dialog
    this.showEntryDialog.set(false);
  }

  updateCellValue(custNo: number, dateStr: string, session: 'AM' | 'PM', field: 'qty' | 'fat', value: string): void {
    const numValue = value ? parseFloat(value) : 0;
    
    // Prevent negative numbers
    if (numValue < 0) {
      return;
    }

    const tenDay = this.ledgerData();
    if (!tenDay) return;

    // Find or create the day record
    let dayRecord = tenDay.records.find(r => this.getDateString(r.day) === dateStr);
    
    if (!dayRecord) {
      // Create new day record
      const date = new Date(dateStr);
      dayRecord = {
        day: date,
        quantities: []
      };
      tenDay.records.push(dayRecord);
    }

    // Find or create customer record in quantities
    let custRecord = dayRecord.quantities.find(q => q.custNo === custNo);
    
    if (custRecord) {
      // Update existing record
      custRecord[session][field] = numValue;
    } else {
      // Add new customer record
      const newRecord: CustDayRecord = {
        custNo,
        AM: { qty: 0, fat: 0 },
        PM: { qty: 0, fat: 0 }
      };
      newRecord[session][field] = numValue;
      dayRecord.quantities.push(newRecord);
    }

    // Mark that we have unsaved changes (no need to update signals as template handles it)
    this.hasUnsavedChanges = true;
  }

  saveLedgerData(isAutoSave: boolean = false): void {
    // TODO: Implement proper save functionality for payment report
    // Currently not implemented - this component is not in use
    
    /* 
    // Prepare data for saving
    const dataToSave = this.tableRows().map(row => ({
      custNo: row.custNo,
      records: Array.from(row.dayRecords.entries()).map(([date, record]) => ({
        date,
        ...record
      }))
    }));
    
    this.ledgerService.saveLedgerEntry(dataToSave).subscribe(result => {
      this.hasUnsavedChanges = false;
      
      // Show success message only for manual saves
      if (!isAutoSave) {
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Ledger data saved successfully',
          life: 3000
        });
      }
    });
    */
  }

  exportData(format?: 'PDF'): void {
    const ledgerData = this.ledgerData();
    const members = this.members();
    const sessionFilter = this.selectedSessionDisplay() as 'AM' | 'PM' | 'AM-PM';

    if (!ledgerData || members.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Data',
        detail: 'No data available to export',
        life: 3000
      });
      return;
    }

    this.dataExportService.exportAsPdf(ledgerData, members, sessionFilter);
    this.messageService.add({
      severity: 'success',
      summary: 'Export Successful',
      detail: 'PDF file downloaded successfully',
      life: 3000
    });
  }
}
