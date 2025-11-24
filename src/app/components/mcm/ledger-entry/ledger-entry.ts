import { Component, OnInit, OnDestroy, signal, computed, effect, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
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
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { LedgerService } from '../../../services/ledger.service';
import { LedgerDataService } from '../../../services/ledger-data.service';
import { DataExportService } from '../../../services/data-export.service';
import { RateCardService } from '../../../services/rate-card.service';
import { AuthService } from '../../../services/auth.service';
import { MemberData } from '../model/member-data.model';
import { TenDayLedger, LedgerDayRecord, CustDayRecord, MilkRecord, CustBill } from '../model/ledger-day.model';
import { RateCard, RateItem } from '../model/rate-card.model';
import { getCurrentPeriodStart, getRandomQty, getRandomFat, getPreviousPeriodStart, getPeriodEnd } from '../model/sample-ledger-data';

interface TableRow {
  custNo: number;
  name_en: string;
  name_tel: string;
  village: string;
  dayRecords: Map<string, CustDayRecord>; // key: date string
}

@Component({
  selector: 'app-ledger-entry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    SelectButtonModule,
    ButtonModule,
    ToastModule,
    DialogModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './ledger-entry.html',
  styleUrls: ['./ledger-entry.scss']
})
export class LedgerEntry implements OnInit, AfterViewInit, OnDestroy {
          /**
           * Returns true if there is a previous day with session data in the ledger
           */
          hasPreviousDay(): boolean {
            const tenDay = this.ledgerData();
            if (!tenDay) return false;
            const currentIndex = tenDay.records.findIndex(r => this.getDateString(r.day) === this.currentDateStr());
            if (currentIndex > 0) return true;
            // At first day, check if previous period exists and has data
            return this.hasPreviousPeriod?.() === true;
          }

          /**
           * Returns true if there is a next day with session data in the ledger
           */
          hasNextDay(): boolean {
            const tenDay = this.ledgerData();
            if (!tenDay) return false;
            const currentIndex = tenDay.records.findIndex(r => this.getDateString(r.day) === this.currentDateStr());
            if (currentIndex < tenDay.records.length - 1 && currentIndex !== -1) return true;
            // At last day, check if next period exists and has data
            return this.hasNextPeriod?.() === true;
          }

          /**
           * Navigates to the previous day in the ledger
           */
          goToPreviousDay(): void {
            const tenDay = this.ledgerData();
            if (!tenDay) return;
            const currentIndex = tenDay.records.findIndex(r => this.getDateString(r.day) === this.currentDateStr());
            if (currentIndex > 0) {
              const prevDay = tenDay.records[currentIndex - 1];
              this.currentDateStr.set(this.getDateString(prevDay.day));
              this.buildTableRows();
            } else if (this.hasPreviousPeriod?.() === true) {
              // At first day, go to last day of previous period
              const previousPeriodStart = getPreviousPeriodStart(tenDay.tenDayStart);
              this.ledgerService.getLedgerData(previousPeriodStart).subscribe({
                next: (data: TenDayLedger) => {
                  if (data.records.length > 0) {
                    const lastDay = data.records[data.records.length - 1];
                    this.ledgerData.set(data);
                    this.currentDateStr.set(this.getDateString(lastDay.day));
                    this.buildTableRows();
                    this.checkPreviousPeriodExists();
                    this.checkNextPeriodExists();
                  }
                }
              });
            }
          }

          /**
           * Navigates to the next day in the ledger
           */
          goToNextDay(): void {
            const tenDay = this.ledgerData();
            if (!tenDay) return;
            const currentIndex = tenDay.records.findIndex(r => this.getDateString(r.day) === this.currentDateStr());
            if (currentIndex < tenDay.records.length - 1 && currentIndex !== -1) {
              const nextDay = tenDay.records[currentIndex + 1];
              this.currentDateStr.set(this.getDateString(nextDay.day));
              this.buildTableRows();
            } else if (this.hasNextPeriod?.() === true) {
              // At last day, go to first day of next period
              const nextPeriodStart = this.getNextPeriodStart(tenDay.tenDayStart);
              this.ledgerService.getLedgerData(nextPeriodStart).subscribe({
                next: (data: TenDayLedger) => {
                  if (data.records.length > 0) {
                    const firstDay = data.records[0];
                    this.ledgerData.set(data);
                    this.currentDateStr.set(this.getDateString(firstDay.day));
                    this.buildTableRows();
                    this.checkPreviousPeriodExists();
                    this.checkNextPeriodExists();
                  }
                }
              });
            }
          }
        /**
         * Toggle between DAY and TEN_DAY modes for the ledger entry view
         */
        toggleDateRange(): void {
          const current = this.selectedDateRange();
          if (current === 'DAY') {
            this.selectedDateRange.set('TEN_DAY');
          } else {
            // Switch to Today mode and set to today's date only (preserve session mode)
            this.selectedDateRange.set('DAY');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            this.currentDateStr.set(this.getDateString(today));
            // Load ledger data for today's billing period
            const periodStart = getCurrentPeriodStart();
            this.ledgerService.getLedgerData(periodStart).subscribe(data => {
              this.ledgerData.set(data);
              this.buildTableRows();
              this.checkPreviousPeriodExists();
              this.checkNextPeriodExists();
              this.ensureTodayRecordsExist();
              this.buildTableRows();
              this.updateUrlParams();
            });
          }
        }
      // --- Navigation helpers ---
      private parsePeriodParam(periodParam?: string): string | undefined {
        if (!periodParam) return undefined;
        const [year, month, day] = periodParam.split('-').map(Number);
        if ([1, 11, 21].includes(day)) {
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        return undefined;
      }

      private setSignalsFromParams(params: any): string | undefined {
        // Date range
        const dateRange = params['dateRange'];
        if (dateRange === 'DAY' || dateRange === 'TEN_DAY') {
          this.selectedDateRange.set(dateRange);
        }
        // Session
        const session = params['session'];
        if (session === 'AM') {
          this.showAM.set(true);
          this.showPM.set(false);
        } else if (session === 'PM') {
          this.showAM.set(false);
          this.showPM.set(true);
        } else if (session === 'AM-PM') {
          this.showAM.set(true);
          this.showPM.set(true);
        }
        // Date/period
        const dateParam = params['date'];
        let periodParam = params['period'];
        if (dateRange === 'TEN_DAY' && periodParam) {
          const validatedPeriod = this.parsePeriodParam(periodParam);
          if (validatedPeriod) {
            this.currentDateStr.set(validatedPeriod);
            return validatedPeriod;
          } else {
            // If invalid, set to today's date
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = this.getDateString(today);
            this.currentDateStr.set(todayStr);
            return todayStr;
          }
        } else if (dateRange === 'DAY') {
          if (dateParam) {
            this.currentDateStr.set(dateParam);
          } else {
            // No date param, set to today's date
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            this.currentDateStr.set(this.getDateString(today));
          }
          return undefined;
        }
        // Default: set to today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        this.currentDateStr.set(this.getDateString(today));
        return this.getDateString(today);
      }

      private changePeriod(periodParam?: string): void {
        this.loadLedgerData(periodParam);
      }
    /**
     * Navigate to home page based on role
     * Admin: main home page (/)
     * Member: mcm home page (/mcm)
     */
    goToHome(): void {
      if (this.authService.isAdmin()) {
        this.router.navigate(['/']);
      } else {
        this.router.navigate(['/mcm']);
      }
    }
    /**
     * Navigate to main home page (regardless of role)
     */
    goToMainHome(): void {
      this.router.navigate(['/']);
    }
  @ViewChild('tableWrapper') tableWrapper?: ElementRef<HTMLDivElement>;
  
  members = signal<MemberData[]>([]);
  ledgerData = signal<TenDayLedger | null>(null);
  tableRows = signal<TableRow[]>([]);
  
  nameDisplayOptions = [
    { label: 'en', value: 'en' },
    { label: 'tel', value: 'tel' }
  ];
  selectedNameDisplay = signal('en');
  
  // Individual AM/PM selection signals
  showAM = signal(true);
  showPM = signal(true);

  // Computed signal for session display based on AM/PM selection
  selectedSessionDisplay = computed(() => {
    const am = this.showAM();
    const pm = this.showPM();
    if (am && pm) return 'AM-PM';
    if (am) return 'AM';
    if (pm) return 'PM';
    return 'AM-PM';
  });

  /**
   * Smart session toggle: toggles between AM/PM and latest session (AM or PM)
   */
  toggleSmartSession(): void {
    const now = new Date();
    const hour = now.getHours();
    const isMorning = hour < 12;
    const ampm = this.selectedSessionDisplay();
    if (ampm === 'AM-PM') {
      // If currently showing both, switch to latest session only
      if (isMorning) {
        this.showAM.set(true);
        this.showPM.set(false);
      } else {
        this.showAM.set(false);
        this.showPM.set(true);
      }
    } else {
      // If currently showing only one, switch to both
      this.showAM.set(true);
      this.showPM.set(true);
    }
    // Rebuild table rows to reflect session change
    this.buildTableRows();
  }
  
  dateRangeOptions = [
    { label: 'Today', value: 'DAY' },
    { label: '10 Day', value: 'TEN_DAY' }
  ];
  selectedDateRange = signal('DAY');
  
  exportFormatOptions = [
    { label: 'JSON', value: 'JSON' },
    { label: 'PDF', value: 'PDF' }
  ];
  selectedExportFormat = signal<'JSON' | 'PDF'>('JSON');
  
  // Bulk edit state
  bulkEditDate = signal<string | null>(null);
  bulkEditSession = signal<'AM' | 'PM' | null>(null);
  
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
  currentDateStr = signal('');
  
  // Admin flag from URL params
  isAdmin = signal<boolean>(false);
  
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
    const result = Array.from(dates).sort();
    console.log('[DEBUG] allDates computed:', result.length, 'dates:', result);
    return result;
  });

  // Show dates based on selection: single day or all days from TEN_DAY_DATA
  visibleDates = computed(() => {
    if (this.selectedDateRange() === 'DAY') {
      const result = [this.currentDateStr()];
      console.log('[DEBUG] visibleDates (DAY):', result.length, result);
      return result;
    } else {
      const result = this.allDates();
      console.log('[DEBUG] visibleDates (TEN_DAY):', result.length, result);
      return result;
    }
  });

  constructor(
    private ledgerService: LedgerService, 
    private ledgerDataService: LedgerDataService,
    private dataExportService: DataExportService,
    private rateCardService: RateCardService,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {
    // Only update URL when signals change, do not trigger data/table updates here
    effect(() => {
      const range = this.selectedDateRange();
      const session = this.selectedSessionDisplay();
      const dateStr = this.currentDateStr();
      if (!this.isInitialLoad) {
        this.updateUrlParams();
      }
    });
  }

  ngOnInit(): void {
    this.route.queryParams.pipe(take(1)).subscribe(params => {
      this.isAdmin.set(this.authService.isAdmin());
      const validatedPeriod = this.setSignalsFromParams(params);
      this.ledgerService.getMembers().subscribe(members => {
        this.members.set(members);
        this.changePeriod(validatedPeriod);
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
    let periodStart: Date | undefined;
    if (periodParam) {
      // Parse date from URL (format: YYYY-MM-DD)
      const [year, month, day] = periodParam.split('-').map(Number);
      if ([1, 11, 21].includes(day)) {
        periodStart = new Date(year, month - 1, day);
        periodStart.setHours(0, 0, 0, 0);
      }
    }
    if (!periodStart) {
      // Use current billing period only if param is missing or invalid
      periodStart = getCurrentPeriodStart();
    }
    // Load ledger data from CouchDB
    this.ledgerService.getLedgerData(periodStart).subscribe(data => {
      this.ledgerData.set(data);
      this.buildTableRows();
      // Check if previous period exists
      this.checkPreviousPeriodExists();
      // If in DAY mode, ensure today's records exist
      if (this.selectedDateRange() === 'DAY') {
        this.ensureTodayRecordsExist();
        // Rebuild table rows after ensuring today's records
        this.buildTableRows();
      }
      // Always update URL after data and signals are set
      this.updateUrlParams();
      // Mark initial load complete
      if (this.isInitialLoad) {
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

    const membersArr = this.members();
    const visibleDatesArr = this.visibleDates();
    console.log('[DEBUG] buildTableRows: members:', membersArr.length, 'visibleDates:', visibleDatesArr.length);

    membersArr.forEach(member => {
      const dayRecords = ledgerMap.get(member.custNo) || new Map();

      visibleDatesArr.forEach(dateStr => {
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

    console.log('[DEBUG] buildTableRows called. Rows count:', rows.length, 'Visible dates:', visibleDatesArr.length);
    this.tableRows.set(rows);
  }

  private getDateString(date: Date): string {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private updateUrlParams(): void {
    const queryParams: any = {
      dateRange: this.selectedDateRange(),
      session: this.selectedSessionDisplay()
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
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[date.getMonth()]}, ${day}`;
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
    // Always show the full billing period, not just dates with data
    const startDate = this.getDateDisplay(this.getDateString(period.tenDayStart));
    const periodEnd = getPeriodEnd(period.tenDayStart);
    const endDate = this.getDateDisplay(this.getDateString(periodEnd));
    
    return `${startDate} - ${endDate}`;
  }

  getPeriodColspan(period: { tenDayStart: Date, dates: string[] }): number {
    return period.dates.length * this.getDateColspan();
  }

  isInPeriod(dateStr: string, period: { tenDayStart: Date, dates: string[] }): boolean {
    return period.dates.includes(dateStr);
  }

  isCurrentPeriod(): boolean {
    const tenDay = this.ledgerData();
    if (!tenDay) return false;
    
    const currentPeriodStart = getCurrentPeriodStart();
    const currentTenDayStart = new Date(tenDay.tenDayStart);
    
    return currentTenDayStart.getTime() === currentPeriodStart.getTime();
  }

  hasPreviousPeriod = signal<boolean>(false);
  hasNextPeriod = signal<boolean>(false);

  private checkPreviousPeriodExists(): void {
    const tenDay = this.ledgerData();
    if (!tenDay) {
      this.hasPreviousPeriod.set(false);
      return;
    }

    const previousPeriodStart = getPreviousPeriodStart(tenDay.tenDayStart);

    this.ledgerService.getLedgerData(previousPeriodStart).subscribe({
      next: (data: TenDayLedger) => {
        // Check if there's any actual data (non-empty records with quantities)
        const hasData = data.records.some(record => 
          record.quantities.some(q => q.AM.qty || q.AM.fat || q.PM.qty || q.PM.fat)
        );
        this.hasPreviousPeriod.set(hasData);
      },
      error: () => {
        this.hasPreviousPeriod.set(false);
      }
    });
  }

  private checkNextPeriodExists(): void {
    const tenDay = this.ledgerData();
    if (!tenDay) {
      this.hasNextPeriod.set(false);
      return;
    }
    const nextPeriodStart = this.getNextPeriodStart(tenDay.tenDayStart);
    this.ledgerService.getLedgerData(nextPeriodStart).subscribe({
      next: (data: TenDayLedger) => {
        const hasData = data.records.some(record => 
          record.quantities.some(q => q.AM.qty || q.AM.fat || q.PM.qty || q.PM.fat)
        );
        this.hasNextPeriod.set(hasData);
      },
      error: () => {
        this.hasNextPeriod.set(false);
      }
    });
  }

  private getNextPeriodStart(currentStart: Date): Date {
    const date = new Date(currentStart);
    const day = date.getDate();
    
    if (day === 1) {
      // Go to 11th of same month
      date.setDate(11);
    } else if (day === 11) {
      // Go to 21st of same month
      date.setDate(21);
    } else {
      // Go to 1st of next month
      date.setMonth(date.getMonth() + 1);
      date.setDate(1);
    }
    
    date.setHours(0, 0, 0, 0);
    return date;
  }

  goToPreviousPeriod(): void {
    const tenDay = this.ledgerData();
    if (!tenDay) return;
    const previousPeriodStart = getPreviousPeriodStart(tenDay.tenDayStart);
    this.changePeriod(this.getDateString(previousPeriodStart));
    // Update URL to reflect new period
    this.updateUrlParams();
  }

  goToNextPeriod(): void {
    const tenDay = this.ledgerData();
    if (!tenDay) return;
    const nextPeriodStart = this.getNextPeriodStart(tenDay.tenDayStart);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (nextPeriodStart.getTime() > today.getTime()) return;
    this.changePeriod(this.getDateString(nextPeriodStart));
    // Update URL to reflect new period
    this.updateUrlParams();
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
    const todayDate = new Date();
    const todayStr = this.getDateString(todayDate);
    const tenDay = this.ledgerData();
    if (!tenDay) return;

    // Check if today's record already exists
    const todayRecordExists = tenDay.records.some(dayRecord => 
      this.getDateString(dayRecord.day) === todayStr
    );

    if (!todayRecordExists) {
      // Create empty ledger day record for today
      const emptyDayRecord: LedgerDayRecord = {
        day: todayDate,
        quantities: this.members().map(member => ({
          custNo: member.custNo,
          AM: { qty: 0, fat: 0 },
          PM: { qty: 0, fat: 0 }
        }))
      };
      tenDay.records.push(emptyDayRecord);
      this.ledgerData.set({ ...tenDay });
      // Set currentDateStr to today if not already set
      if (!this.currentDateStr() || this.currentDateStr() === '') {
        this.currentDateStr.set(todayStr);
      }
      // Rebuild table rows
      this.buildTableRows();
    }
  }

  openEntryDialog(row: TableRow): void {
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

  navigateToPassbook(custNo: number): void {
    const tenDay = this.ledgerData();
    if (!tenDay) return;

    // Get the billing period start date
    const periodStart = this.getDateString(tenDay.tenDayStart);
    
    // Get current query params to preserve them
    const currentParams = { ...this.route.snapshot.queryParams };
    
    // Navigate to user passbook with customer number, period, and all current params
    this.router.navigate(['/mcm/user-passbook'], {
      queryParams: {
        ...currentParams,
        custNo: custNo,
        period: periodStart
      }
    });
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
      // Create new day record - parse at midnight local time
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day, 0, 0, 0, 0);
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
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day, 0, 0, 0, 0);
      dayRecord = {
        day: date,
        quantities: []
      };
      tenDay.records.push(dayRecord);
    }

    // Find or create customer record in quantities
    let custRecord = dayRecord.quantities.find(q => q.custNo === custNo);
    if (custRecord) {
      custRecord[session][field] = numValue;
    } else {
      const newRecord: CustDayRecord = {
        custNo,
        AM: { qty: 0, fat: 0 },
        PM: { qty: 0, fat: 0 }
      };
      newRecord[session][field] = numValue;
      dayRecord.quantities.push(newRecord);
    }

    // Only update the ledgerData signal, do not rebuild table rows
    this.ledgerData.set({ ...tenDay });
    this.hasUnsavedChanges = true;
  }

  saveLedgerData(isAutoSave: boolean = false): void {
    const tenDay = this.ledgerData();
    if (!tenDay) return;

    // Recalculate and update qty totals for all sessions and all days
    tenDay.records.forEach(dayRecord => {
      let amTotal = 0;
      let pmTotal = 0;
      dayRecord.quantities.forEach(custRecord => {
        amTotal += custRecord.AM.qty || 0;
        pmTotal += custRecord.PM.qty || 0;
      });
      amTotal = Math.round(amTotal * 10) / 10;
      pmTotal = Math.round(pmTotal * 10) / 10;
      if (!dayRecord.dayTotal) {
        dayRecord.dayTotal = {
          AM: { qty: 0, fat: 0 },
          PM: { qty: 0, fat: 0 }
        };
      }
      dayRecord.dayTotal.AM.qty = amTotal;
      dayRecord.dayTotal.PM.qty = pmTotal;
    });

    // Save the full tenDay object (including dayTotal)
    this.ledgerService.saveLedgerEntry(tenDay).subscribe(result => {
      this.hasUnsavedChanges = false;
      // Update the signal with the saved data to ensure UI is in sync
      this.ledgerData.set({ ...tenDay });
      this.buildTableRows();
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
  }

  exportData(format?: 'JSON' | 'PDF'): void {
    const ledgerData = this.ledgerData();
    const members = this.members();
    const sessionFilter = this.selectedSessionDisplay() as 'AM' | 'PM' | 'AM-PM';
    const exportFormat = format || this.selectedExportFormat();

    if (!ledgerData || members.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Data',
        detail: 'No data available to export',
        life: 3000
      });
      return;
    }

    if (exportFormat === 'JSON') {
      this.dataExportService.exportAsJson(ledgerData, members, sessionFilter);
      this.messageService.add({
        severity: 'success',
        summary: 'Export Successful',
        detail: 'JSON file downloaded successfully',
        life: 3000
      });
    } else {
      this.dataExportService.exportAsPdf(ledgerData, members, sessionFilter);
      this.messageService.add({
        severity: 'success',
        summary: 'Export Successful',
        detail: 'PDF file downloaded successfully',
        life: 3000
      });
    }
  }

  enableBulkEdit(dateStr: string, session: 'AM' | 'PM'): void {
    this.bulkEditDate.set(dateStr);
    this.bulkEditSession.set(session);
  }

  isBulkEditing(dateStr: string, session: 'AM' | 'PM'): boolean {
    const editDate = this.bulkEditDate();
    const editSession = this.bulkEditSession();
    return editDate === dateStr && editSession === session;
  }

  canEditSession(dateStr: string, session: 'AM' | 'PM'): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const todayStr = this.getDateString(now);
    
    // If it's a past date, allow editing
    if (dateStr < todayStr) {
      return true;
    }
    
    // If it's a future date, don't allow editing
    if (dateStr > todayStr) {
      return false;
    }
    
    // For today's date, check the time:
    // AM session: can edit only after 5 AM (5:00)
    // PM session: can edit only after 4 PM (16:00)
    if (session === 'AM') {
      return currentHour >= 5;
    } else {
      return currentHour >= 16;
    }
  }

  getCustBill(custNo: number): CustBill | undefined {
    const tenDay = this.ledgerData();
    if (!tenDay?.custBills) return undefined;
    return tenDay.custBills.find(bill => bill.custNo === custNo);
  }

  getQtyTotal(dateStr: string, session: 'AM' | 'PM'): number {
    const tenDay = this.ledgerData();
    if (!tenDay) return 0;
    
    const dayRecord = tenDay.records.find(r => {
      const recordDateStr = this.getDateString(r.day);
      return recordDateStr === dateStr;
    });
    
    if (!dayRecord?.dayTotal) return 0;
    
    return session === 'AM' ? (dayRecord.dayTotal.AM.qty || 0) : (dayRecord.dayTotal.PM.qty || 0);
  }
  
  getTotalPrevDue(): number {
    const tenDay = this.ledgerData();
    if (!tenDay?.custBills) return 0;
    
    return Math.round(tenDay.custBills.reduce((sum, bill) => sum + (bill.prevDueAmt || 0), 0) * 100) / 100;
  }


  getTotalQty(): number {
    const tenDay = this.ledgerData();
    if (!tenDay?.custBills) return 0;
    return Math.round(tenDay.custBills.reduce((sum, bill) => sum + (bill.totalQty || 0), 0) * 10) / 10;
  }

  getTotalDue(): number {
    const tenDay = this.ledgerData();
    if (!tenDay?.custBills) return 0;
    return Math.round(tenDay.custBills.reduce((sum, bill) => sum + (bill.dueAmt || 0), 0) * 100) / 100;
  }

  saveBulkEdit(): void {
    const editDate = this.bulkEditDate();
    const editSession = this.bulkEditSession();
    
    if (editDate && editSession) {
      // Calculate session totals for the edited date
      const tenDay = this.ledgerData();
      if (tenDay) {
        const dayRecord = tenDay.records.find(r => {
          const recordDateStr = this.getDateString(r.day);
          return recordDateStr === editDate;
        });
        
        if (dayRecord) {
          let totalQty = 0;
          
          // Sum up qty for the edited session
          dayRecord.quantities.forEach(custRecord => {
            const milkRecord = editSession === 'AM' ? custRecord.AM : custRecord.PM;
            totalQty += milkRecord.qty || 0;
          });
          
          // Round to 1 decimal place to avoid floating-point precision errors
          totalQty = Math.round(totalQty * 10) / 10;
          
          // Create or update dayTotal
          if (!dayRecord.dayTotal) {
            dayRecord.dayTotal = {
              AM: { qty: 0, fat: 0 },
              PM: { qty: 0, fat: 0 }
            };
          }
          
          // Update the session total qty in dayTotal
          if (editSession === 'AM') {
            dayRecord.dayTotal.AM.qty = totalQty;
          } else {
            dayRecord.dayTotal.PM.qty = totalQty;
          }
        }
      }
    }
    
    // Save the data (this will update the signal and rebuild table)
    this.saveLedgerData(false);
    
    // Exit bulk edit mode
    this.bulkEditDate.set(null);
    this.bulkEditSession.set(null);
  }

  fillMockDataForSession(): void {
    const editDate = this.bulkEditDate();
    const editSession = this.bulkEditSession();
    
    if (!editDate || !editSession) return;
    
    const tenDay = this.ledgerData();
    if (!tenDay) return;
    
    // Find the actual day record in the ledger
    let dayRecord = tenDay.records.find(r => {
      const recordDateStr = this.getDateString(r.day);
      return recordDateStr === editDate;
    });
    
    if (!dayRecord) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Day Record',
        detail: `No day record found for ${editDate}`
      });
      return;
    }
    
    // Fill the session data with random mock data for all customers
    dayRecord.quantities.forEach(custRecord => {
      // Generate random data with 80% chance of having values
      const hasData = Math.random() < 0.8;
      
      if (editSession === 'AM') {
        if (hasData) {
          custRecord.AM.qty = getRandomQty();
          custRecord.AM.fat = getRandomFat();
        } else {
          custRecord.AM.qty = 0;
          custRecord.AM.fat = 0;
        }
      } else {
        if (hasData) {
          custRecord.PM.qty = getRandomQty();
          custRecord.PM.fat = getRandomFat();
        } else {
          custRecord.PM.qty = 0;
          custRecord.PM.fat = 0;
        }
      }
    });
    
    // Force update by creating new ledger data object with new records array
    const updatedRecords = tenDay.records.map(rec => {
      if (this.getDateString(rec.day) === editDate) {
        return {
          ...rec,
          quantities: rec.quantities.map(q => ({ ...q }))
        };
      }
      return rec;
    });
    
    this.ledgerData.set({ 
      ...tenDay, 
      records: updatedRecords
    });
    
    // Rebuild table to reflect changes
    this.buildTableRows();
    
    // Trigger change detection
    this.cdr.detectChanges();
    
    this.messageService.add({
      severity: 'success',
      summary: 'Mock Data Filled',
      detail: `Mock data filled for ${editDate} ${editSession} session`
    });
  }

  // Removed toggleAM and togglePM, replaced by toggleSmartSession

  onDateRangeChange(newValue: string): void {
    // Only change if the new value is different from current
    if (newValue !== this.selectedDateRange()) {
      this.selectedDateRange.set(newValue);
      // Rebuild table rows to reflect mode change
      this.buildTableRows();
    }
  }

  setDateRange(range: 'DAY' | 'TEN_DAY'): void {
    // Only change if different from current selection
    if (range !== this.selectedDateRange()) {
      this.selectedDateRange.set(range);
      // Rebuild table rows to reflect mode change
      this.buildTableRows();
    }
  }

  runBills(): void {
    const tenDay = this.ledgerData();
    if (!tenDay) return;

    // Check if already billed and ask for confirmation
    if (tenDay.isBilled) {
      if (!confirm('Bills have already been run for this period. Do you want to re-run the bills? This will recalculate all amounts.')) {
        return;
      }
    }

    // Get the applicable pay rate for this billing period
    this.rateCardService.getPayRate(tenDay.tenDayStart).subscribe(rateCard => {
      // Find applicable rate item
      const applicableRate = rateCard.items
        .filter(item => new Date(item.effectiveDate) <= tenDay.tenDayStart)
        .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime())[0];
      
      const payRate = applicableRate?.payRate || 8; // Default to 8 if no rate found

      // Load previous period data to get previous due amounts
      const previousPeriodStart = getPreviousPeriodStart(tenDay.tenDayStart);
      
      this.ledgerService.getLedgerData(previousPeriodStart).subscribe(previousLedger => {
        // Log previous ledger info for debugging
        
        // Map to store total amount and total quantity per customer
        const customerTotals = new Map<number, { amount: number; qty: number }>();

        // Calculate amounts for all records and accumulate per customer
        tenDay.records.forEach(dayRecord => {
          dayRecord.quantities.forEach(custRecord => {
            // Calculate AM amount
            if (custRecord.AM.qty && custRecord.AM.fat) {
              custRecord.AM.amount = Math.round(custRecord.AM.qty * custRecord.AM.fat * payRate * 100) / 100;
            } else {
              custRecord.AM.amount = 0;
            }

            // Calculate PM amount
            if (custRecord.PM.qty && custRecord.PM.fat) {
              custRecord.PM.amount = Math.round(custRecord.PM.qty * custRecord.PM.fat * payRate * 100) / 100;
            } else {
              custRecord.PM.amount = 0;
            }

            // Get or initialize customer totals
            const existing = customerTotals.get(custRecord.custNo) || { amount: 0, qty: 0 };
            
            // Accumulate total amount and quantity for this customer
            const totalAmount = existing.amount + (custRecord.AM.amount || 0) + (custRecord.PM.amount || 0);
            const totalQty = existing.qty + (custRecord.AM.qty || 0) + (custRecord.PM.qty || 0);
            
            customerTotals.set(custRecord.custNo, {
              amount: Math.round(totalAmount * 100) / 100,
              qty: Math.round(totalQty * 10) / 10
            });
          });

          // Mark day record as verified
          dayRecord.isVerified = true;
        });

        // Create CustBill records for each customer
        tenDay.custBills = Array.from(customerTotals.entries()).map(([custNo, totals]) => {
          // Get previous due amount for this customer
          const prevBill = previousLedger?.custBills?.find(bill => bill.custNo === custNo);
          const prevDueAmt = prevBill?.dueAmt || 0;
          
          // Log for debugging
          if (custNo <= 3) { // Only log first 3 customers to avoid spam
          }
          
          return {
            custNo,
            totalQty: totals.qty,
            amount: Math.round(totals.amount * 100) / 100,
            prevDueAmt: Math.round(prevDueAmt * 100) / 100,
            paidAmt: 0,
            dueAmt: Math.round((totals.amount + prevDueAmt) * 100) / 100,
            remarks: ''
          };
        });

        // Calculate totals
        tenDay.totalAmt = Math.round(Array.from(customerTotals.values()).reduce((sum, totals) => sum + totals.amount, 0) * 100) / 100;
        
        // Initialize receivedAmt and pendingAmt only if not already set
        if (tenDay.receivedAmt === undefined) {
          tenDay.receivedAmt = 0;
        }
        if (tenDay.pendingAmt === undefined) {
          tenDay.pendingAmt = tenDay.totalAmt;
        }
        
        // Mark as billed
        tenDay.isBilled = true;

        // Update ledger data
        this.ledgerData.set({ ...tenDay });
        this.buildTableRows();

        // Save the updated data
        this.saveLedgerData(false);

        this.messageService.add({
          severity: 'success',
          summary: 'Bills Generated',
          detail: `Bills generated successfully for ${customerTotals.size} customers. Total: ${tenDay.totalAmt.toFixed(2)}`,
          life: 5000
        });
      });
    });
  }

  exportToJSON(): void {
    const ledger = this.ledgerData();
    if (!ledger) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No ledger data to export'
      });
      return;
    }

    const dataStr = JSON.stringify(ledger, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ledger_${this.getDateString(ledger.tenDayStart)}.json`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Ledger data exported to JSON'
    });
  }

  async exportToPDF(): Promise<void> {
    const ledger = this.ledgerData();
    if (!ledger) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No ledger data to export'
      });
      return;
    }

    try {
      // Use the existing DataExportService
      const sessionFilter = this.selectedSessionDisplay() as 'AM' | 'PM' | 'AM-PM';
      this.dataExportService.exportAsPdf(ledger, this.members(), sessionFilter);
      
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'PDF exported successfully'
      });
    } catch (error) {
      // ...existing code...
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to export PDF'
      });
    }
  }

  reRunBills(): void {
    if (!this.isAdmin()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Unauthorized',
        detail: 'Only admins can re-run bills'
      });
      return;
    }

    // Simply call runBills again - it will recalculate everything
    this.runBills();
  }

  getFatLevelClass(fat: number): string {
    return fat > 5 &&  fat < 9 ? 'fat-level-' + Math.floor(fat) : fat >= 9 ? 'fat-level-9' : '';
  }

  getQtyLevelClass(qty: number): string {
    return qty >= 3 && qty < 7 ? 'qty-level-' + Math.floor(qty) : qty >= 7 ? 'qty-level-6' : '';
  }
}
