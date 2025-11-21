import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { LedgerService } from '../../../services/ledger.service';
import { RateCardService } from '../../../services/rate-card.service';
import { PdfUtilsService } from '../../../services/pdf-utils.service';
import { MemberData } from '../model/member-data.model';
import { TenDayLedger, CustDayRecord, CustBill } from '../model/ledger-day.model';
import { getPeriodEnd, getPreviousPeriodStart } from '../model/sample-ledger-data';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PassbookRow {
  date: string;
  dateObj: Date;
  AM: {
    qty: number;
    fat: number;
    amt: number;
  };
  PM: {
    qty: number;
    fat: number;
    amt: number;
  };
  dayAmt: number;
}

@Component({
  selector: 'app-user-passbook',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    TableModule,
    InputNumberModule,
    ToastModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './user-passbook.html',
  styleUrls: ['./user-passbook.scss']
})
export class UserPassbook implements OnInit {
  custNo = signal<number | null>(null);
  period = signal<string | null>(null);
  customer = signal<MemberData | null>(null);
  ledgerData = signal<TenDayLedger | null>(null);
  payRate = signal<number>(8); // Default rate
  
  passbookRows = signal<PassbookRow[]>([]);
  
  // Payment editing
  isEditMode = signal<boolean>(false);
  paidAmtInput = signal<number>(0);
  
  periodEnd = computed(() => {
    const ledger = this.ledgerData();
    if (!ledger) return '';
    const endDate = getPeriodEnd(ledger.tenDayStart);
    return this.getDateString(endDate);
  });
  
  totals = computed(() => {
    const rows = this.passbookRows();
    return {
      AM: {
        qty: rows.reduce((sum, row) => sum + row.AM.qty, 0),
        amt: rows.reduce((sum, row) => sum + row.AM.amt, 0)
      },
      PM: {
        qty: rows.reduce((sum, row) => sum + row.PM.qty, 0),
        amt: rows.reduce((sum, row) => sum + row.PM.amt, 0)
      },
      total: rows.reduce((sum, row) => sum + row.dayAmt, 0)
    };
  });
  
  custBill = computed(() => {
    const ledger = this.ledgerData();
    const custNo = this.custNo();
    if (!ledger || !custNo) return null;
    return ledger.custBills?.find(bill => bill.custNo === custNo) || null;
  });
  
  dueAmt = computed(() => {
    const total = this.totals().total;
    const custBill = this.custBill();
    const paidAmt = this.isEditMode() ? this.paidAmtInput() : (custBill?.paidAmt || 0);
    const prevDueAmt = custBill?.prevDueAmt || 0;
    return Math.round((total + prevDueAmt - paidAmt) * 100) / 100;
  });

  hasPreviousPeriod = signal<boolean>(false);

  hasNextPeriod = computed(() => {
    const ledger = this.ledgerData();
    if (!ledger) return false;
    const nextPeriodStart = this.getNextPeriodStart(ledger.tenDayStart);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return nextPeriodStart.getTime() <= today.getTime();
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ledgerService: LedgerService,
    private rateCardService: RateCardService,
    private messageService: MessageService,
    private pdfUtils: PdfUtilsService
  ) {}

  ngOnInit(): void {
    // Get query parameters
    this.route.queryParams.subscribe(params => {
      const custNo = params['custNo'];
      const period = params['period'];
      
      if (custNo) {
        this.custNo.set(parseInt(custNo, 10));
      }
      
      if (period) {
        this.period.set(period);
        this.loadData(period);
      }
    });
  }
  
  private loadData(periodStr: string): void {
    const custNo = this.custNo();
    if (!custNo) return;
    
    // Parse period date
    const [year, month, day] = periodStr.split('-').map(Number);
    const periodStart = new Date(year, month - 1, day, 0, 0, 0, 0);
    
    // Load customer data
    this.ledgerService.getMembers().subscribe(members => {
      const customer = members.find(m => m.custNo === custNo);
      this.customer.set(customer || null);
    });
    
    // Load ledger data
    this.ledgerService.getLedgerData(periodStart).subscribe(ledger => {
      this.ledgerData.set(ledger);
      
      // Check for previous period data
      this.checkPreviousPeriodExists();
      
      // Get pay rate for this period
      this.rateCardService.getPayRate(periodStart).subscribe(rateCard => {
        const applicableRate = rateCard.items
          .filter(item => new Date(item.effectiveDate) <= periodStart)
          .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime())[0];
        
        this.payRate.set(applicableRate?.payRate || 8);
        
        // Build passbook rows
        this.buildPassbookRows(ledger, custNo);
      });
    });
  }

  goBack(): void {
    // Get all current query params and remove passbook-specific ones
    const currentParams = { ...this.route.snapshot.queryParams };
    delete currentParams['custNo'];
    
    // Navigate back to ledger-entry with all preserved params
    this.router.navigate(['/mcm/ledger-entry'], { 
      queryParams: currentParams 
    });
  }
  
  private buildPassbookRows(ledger: TenDayLedger, custNo: number): void {
    const rows: PassbookRow[] = [];
    const rate = this.payRate();
    
    ledger.records.forEach(dayRecord => {
      const custRecord = dayRecord.quantities.find(q => q.custNo === custNo);
      
      if (custRecord) {
        const amAmt = custRecord.AM.qty && custRecord.AM.fat 
          ? Math.round(custRecord.AM.qty * custRecord.AM.fat * rate * 100) / 100 
          : 0;
        const pmAmt = custRecord.PM.qty && custRecord.PM.fat 
          ? Math.round(custRecord.PM.qty * custRecord.PM.fat * rate * 100) / 100 
          : 0;
        
        rows.push({
          date: this.getDateString(dayRecord.day),
          dateObj: dayRecord.day,
          AM: {
            qty: custRecord.AM.qty || 0,
            fat: custRecord.AM.fat || 0,
            amt: amAmt
          },
          PM: {
            qty: custRecord.PM.qty || 0,
            fat: custRecord.PM.fat || 0,
            amt: pmAmt
          },
          dayAmt: Math.round((amAmt + pmAmt) * 100) / 100
        });
      }
    });
    
    // Sort by date
    rows.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    
    this.passbookRows.set(rows);
    
    // Initialize paidAmtInput with existing value
    const custBill = this.custBill();
    if (custBill) {
      this.paidAmtInput.set(custBill.paidAmt || 0);
    }
  }
  
  enterEditMode(): void {
    const custBill = this.custBill();
    if (custBill) {
      this.paidAmtInput.set(custBill.paidAmt || 0);
    }
    this.isEditMode.set(true);
  }
  
  cancelEdit(): void {
    const custBill = this.custBill();
    if (custBill) {
      this.paidAmtInput.set(custBill.paidAmt || 0);
    }
    this.isEditMode.set(false);
  }
  
  savePayment(): void {
    const ledger = this.ledgerData();
    const custNo = this.custNo();
    
    if (!ledger || !custNo) return;
    
    // Find or create custBill for this customer
    let custBillIndex = ledger.custBills?.findIndex(bill => bill.custNo === custNo) ?? -1;
    
    if (custBillIndex === -1) {
      // Create new CustBill if it doesn't exist
      if (!ledger.custBills) {
        ledger.custBills = [];
      }
      const totalAmt = this.totals().total;
      ledger.custBills.push({
        custNo,
        totalQty: this.totals().AM.qty + this.totals().PM.qty,
        amount: totalAmt,
        prevDueAmt: 0,
        paidAmt: 0,
        dueAmt: totalAmt,
        remarks: ''
      });
      custBillIndex = ledger.custBills.length - 1;
    }
    
    // Update paidAmt and calculate dueAmt
    const paidAmt = Math.round(this.paidAmtInput() * 100) / 100;
    const totalAmt = this.totals().total;
    const prevDueAmt = ledger.custBills[custBillIndex].prevDueAmt || 0;
    const dueAmt = Math.round((totalAmt + prevDueAmt - paidAmt) * 100) / 100;
    
    ledger.custBills[custBillIndex].paidAmt = paidAmt;
    ledger.custBills[custBillIndex].dueAmt = dueAmt;
    
    // Save to database
    this.ledgerService.saveLedgerEntry(ledger).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Payment saved successfully'
        });
        this.isEditMode.set(false);
        // Refresh ledger data
        this.ledgerData.set({ ...ledger });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save payment'
        });
        // ...existing code...
      }
    });
  }
  
  private getDateString(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  isCurrentPeriod(): boolean {
    const ledger = this.ledgerData();
    if (!ledger) return false;
    
    const currentPeriodStart = this.getCurrentPeriodStart();
    const currentTenDayStart = new Date(ledger.tenDayStart);
    
    return currentTenDayStart.getTime() === currentPeriodStart.getTime();
  }

  private getCurrentPeriodStart(): Date {
    const now = new Date();
    const day = now.getDate();
    
    if (day >= 21) {
      return new Date(now.getFullYear(), now.getMonth(), 21, 0, 0, 0, 0);
    } else if (day >= 11) {
      return new Date(now.getFullYear(), now.getMonth(), 11, 0, 0, 0, 0);
    } else {
      return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    }
  }

  private checkPreviousPeriodExists(): void {
    const ledger = this.ledgerData();
    if (!ledger) {
      this.hasPreviousPeriod.set(false);
      return;
    }
    
    const previousPeriodStart = getPreviousPeriodStart(ledger.tenDayStart);
    const custNo = this.custNo();
    if (!custNo) return;
    
    this.ledgerService.getLedgerData(previousPeriodStart).subscribe({
      next: (data: TenDayLedger) => {
        // Check if customer has any data in previous period
        const hasData = data.records.some(record => 
          record.quantities.some(q => q.custNo === custNo && (q.AM.qty || q.AM.fat || q.PM.qty || q.PM.fat))
        );
        this.hasPreviousPeriod.set(hasData);
      },
      error: () => {
        this.hasPreviousPeriod.set(false);
      }
    });
  }

  private getNextPeriodStart(currentStart: Date): Date {
    const date = new Date(currentStart);
    const day = date.getDate();
    
    if (day === 1) {
      date.setDate(11);
    } else if (day === 11) {
      date.setDate(21);
    } else {
      date.setMonth(date.getMonth() + 1);
      date.setDate(1);
    }
    
    date.setHours(0, 0, 0, 0);
    return date;
  }

  goToPreviousPeriod(): void {
    const ledger = this.ledgerData();
    const custNo = this.custNo();
    if (!ledger || !custNo) return;
    
    const previousPeriodStart = getPreviousPeriodStart(ledger.tenDayStart);
    const periodStr = this.getDateString(previousPeriodStart);
    
    // Navigate to previous period with same customer
    this.router.navigate(['/mcm/user-passbook'], {
      queryParams: { custNo, period: periodStr }
    });
  }

  goToNextPeriod(): void {
    const ledger = this.ledgerData();
    const custNo = this.custNo();
    if (!ledger || !custNo) return;

    const nextPeriodStart = this.getNextPeriodStart(ledger.tenDayStart);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Only allow navigation if next period start is not in the future
    if (nextPeriodStart.getTime() > today.getTime()) return;

    const periodStr = this.getDateString(nextPeriodStart);
    this.router.navigate(['/mcm/user-passbook'], {
      queryParams: { custNo, period: periodStr }
    });
  }

  async shareViaWhatsApp(): Promise<void> {
    const customer = this.customer();
    const ledger = this.ledgerData();
    const rows = this.passbookRows();
    
    if (!customer || !ledger || rows.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Unable to generate PDF. Missing data.'
      });
      return;
    }

    // Check if customer has a mobile number
    if (!customer.mobileNo) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Phone Number',
        detail: 'Customer does not have a mobile number registered.'
      });
      return;
    }

    try {
      // Generate PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      this.pdfUtils.addCenteredHeader(doc, 'Milk Collection Passbook', 15, 16);
      
      // Customer Details
      let currentY = this.pdfUtils.addCustomerDetails(doc, {
        name_en: customer.name_en,
        village: customer.village,
        custNo: customer.custNo
      }, 25);
      
      // Billing Period
      const periodStart = this.period();
      const periodEnd = this.periodEnd();
      if (periodStart && periodEnd) {
        const startDate = new Date(periodStart);
        const endDate = new Date(periodEnd);
        currentY = this.pdfUtils.addBillingPeriod(doc, startDate, endDate, currentY);
      }
      
      // Table Data
      const tableData = rows.map(row => [
        new Date(row.dateObj).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        row.AM.qty > 0 ? row.AM.qty.toFixed(1) : '-',
        row.AM.fat > 0 ? row.AM.fat.toFixed(1) : '-',
        row.AM.amt > 0 ? row.AM.amt.toFixed(2) : '-',
        row.PM.qty > 0 ? row.PM.qty.toFixed(1) : '-',
        row.PM.fat > 0 ? row.PM.fat.toFixed(1) : '-',
        row.PM.amt > 0 ? row.PM.amt.toFixed(2) : '-',
        row.dayAmt > 0 ? row.dayAmt.toFixed(2) : '-'
      ]);
      
      // Add totals row
      const totals = this.totals();
      tableData.push([
        'Total',
        totals.AM.qty.toFixed(1),
        '-',
        totals.AM.amt.toFixed(2),
        totals.PM.qty.toFixed(1),
        '-',
        totals.PM.amt.toFixed(2),
        totals.total.toFixed(2)
      ]);
      
      autoTable(doc, {
        startY: currentY + 6,
        head: [
          ['Date', { content: 'AM Session', colSpan: 3 }, { content: 'PM Session', colSpan: 3 }, 'Day Amt'],
          ['', 'Qty', 'Fat', '₹', 'Qty', 'Fat', '₹', '₹']
        ],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 15 },
          2: { cellWidth: 15 },
          3: { cellWidth: 18 },
          4: { cellWidth: 15 },
          5: { cellWidth: 15 },
          6: { cellWidth: 18 },
          7: { cellWidth: 20 }
        },
        didParseCell: (data) => {
          if (data.row.index === tableData.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 240, 240];
          }
        }
      });
      
      // Payment Summary
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      const custBill = this.custBill();
      const paidAmt = custBill?.paidAmt || 0;
      const prevDueAmt = custBill?.prevDueAmt || 0;
      const dueAmt = this.dueAmt();
      
      this.pdfUtils.addPaymentSummary(doc, {
        billedAmount: totals.total,
        prevDueAmount: prevDueAmt,
        paidAmount: paidAmt,
        dueAmount: dueAmt
      }, finalY);
      
      // Create File object
      const fileName = `${customer.name_en.replace(/\s+/g, '_')}_${periodStart}.pdf`;
      const file = this.pdfUtils.createPdfFile(doc, fileName);
      
      // Prepare WhatsApp message
      const message = this.pdfUtils.generateWhatsAppMessage(
        { name_en: customer.name_en },
        { 
          start: new Date(periodStart!), 
          end: new Date(periodEnd!) 
        },
        {
          totalAmount: totals.total,
          prevDueAmount: prevDueAmt,
          paidAmount: paidAmt,
          dueAmount: dueAmt
        }
      );
      
      // Format phone number
      const phoneNumber = this.pdfUtils.formatPhoneForWhatsApp(customer.mobileNo);
      
      // Check if Web Share API with files is supported
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Milk Collection Passbook',
            text: message
          });
          
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Shared successfully!'
          });
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            // ...existing code...
            this.fallbackToWhatsAppWeb(phoneNumber, message);
          }
        }
      } else {
        // Fallback: Open WhatsApp Web with message only
        this.fallbackToWhatsAppWeb(phoneNumber, message);
      }
      
    } catch (error) {
      // ...existing code...
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to generate PDF'
      });
    }
  }
  
  private fallbackToWhatsAppWeb(phoneNumber: string, message: string): void {
    const encodedMessage = encodeURIComponent(message + '\n\n(PDF will be sent separately)');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    
    this.messageService.add({
      severity: 'info',
      summary: 'WhatsApp Opened',
      detail: 'Please send the PDF manually from your device.'
    });
  }
  
}
