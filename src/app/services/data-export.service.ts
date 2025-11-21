import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TenDayLedger } from '../components/mcm/model/ledger-day.model';
import { MemberData } from '../components/mcm/model/member-data.model';
import { PdfUtilsService } from './pdf-utils.service';

@Injectable({
  providedIn: 'root'
})
export class DataExportService {

  constructor(private pdfUtils: PdfUtilsService) {}

  /**
   * Export ledger data as JSON
   * @param ledgerData The billing period data to export
   * @param members List of all members
   * @param sessionFilter Current session filter (AM/PM/AM-PM)
   */
  exportAsJson(ledgerData: TenDayLedger, members: MemberData[], sessionFilter: 'AM' | 'PM' | 'AM-PM'): void {
    if (!ledgerData || ledgerData.records.length === 0) {
      // ...existing code...
      return;
    }

    // Sort dates
    const sortedRecords = [...ledgerData.records].sort((a, b) => 
      new Date(a.day).getTime() - new Date(b.day).getTime()
    );

    // Create a map of customer data
    const memberMap = new Map<number, MemberData>();
    members.forEach(m => memberMap.set(m.custNo, m));

    // Generate export data
    const exportData = {
      billingPeriod: {
        start: this.pdfUtils.formatDateForFile(ledgerData.tenDayStart),
        end: sortedRecords.length > 0 
          ? this.pdfUtils.formatDateForFile(sortedRecords[sortedRecords.length - 1].day)
          : this.pdfUtils.formatDateForFile(ledgerData.tenDayStart)
      },
      data: members.map(member => ({
        custNo: member.custNo,
        name_en: member.name_en,
        name_tel: member.name_tel,
        village: member.village,
        records: sortedRecords.map(dayRecord => {
          const custRecord = dayRecord.quantities.find(q => q.custNo === member.custNo);
          const record: any = {
            date: this.pdfUtils.formatDateForFile(dayRecord.day)
          };

          if (custRecord) {
            if (sessionFilter === 'AM' || sessionFilter === 'AM-PM') {
              record.AM = {
                qty: custRecord.AM.qty > 0 ? custRecord.AM.qty : null,
                fat: custRecord.AM.fat > 0 ? custRecord.AM.fat : null,
                amount: custRecord.AM.amount || null
              };
            }
            if (sessionFilter === 'PM' || sessionFilter === 'AM-PM') {
              record.PM = {
                qty: custRecord.PM.qty > 0 ? custRecord.PM.qty : null,
                fat: custRecord.PM.fat > 0 ? custRecord.PM.fat : null,
                amount: custRecord.PM.amount || null
              };
            }
          }

          return record;
        })
      }))
    };

    // Convert to JSON string
    const jsonContent = JSON.stringify(exportData, null, 2);

    // Create filename
    const startDate = this.pdfUtils.formatDateForFile(ledgerData.tenDayStart);
    const endDate = sortedRecords.length > 0 
      ? this.pdfUtils.formatDateForFile(sortedRecords[sortedRecords.length - 1].day)
      : startDate;
    const filename = `ledger_${startDate}_to_${endDate}.json`;

    // Download
    this.downloadFile(jsonContent, filename, 'application/json');
  }

  /**
   * Export ledger data as PDF
   * @param ledgerData The billing period data to export
   * @param members List of all members
   * @param sessionFilter Current session filter (AM/PM/AM-PM)
   */
  exportAsPdf(ledgerData: TenDayLedger, members: MemberData[], sessionFilter: 'AM' | 'PM' | 'AM-PM'): void {
    if (!ledgerData || ledgerData.records.length === 0) {
      // ...existing code...
      return;
    }

    // Create PDF in portrait A4
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Sort dates
    const sortedRecords = [...ledgerData.records].sort((a, b) => 
      new Date(a.day).getTime() - new Date(b.day).getTime()
    );

    // Title
    const startDate = this.pdfUtils.formatDateShort(ledgerData.tenDayStart);
    const endDate = sortedRecords.length > 0 
      ? this.pdfUtils.formatDateShort(sortedRecords[sortedRecords.length - 1].day)
      : startDate;    
    this.pdfUtils.addSubtitle(doc, `Ledger for Billing Period: ${startDate} - ${endDate}`, 20);

    // Split records for two pages
    const firstHalf = sortedRecords.slice(0, 5);
    const secondHalf = sortedRecords.slice(5, 10);

    // Helper to build headers for a set of days
    function buildHeaders(days: any[], sessionFilter: string) {
      const headers: any[] = [
        { content: 'No', rowSpan: 3, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Name', rowSpan: 3, styles: { halign: 'center', valign: 'middle' } }
      ];
      const sessionHeaders: any[] = [];
      const qtyFatHeaders: any[] = [];
      days.forEach(dayRecord => {
        const dateDisplay = doc ? dayRecord.day.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '';
        let dateColspan = 0;
        if (sessionFilter === 'AM' || sessionFilter === 'AM-PM') dateColspan += 2;
        if (sessionFilter === 'PM' || sessionFilter === 'AM-PM') dateColspan += 2;
        headers.push({ content: dateDisplay, colSpan: dateColspan, styles: { halign: 'center', valign: 'middle' } });
        if (sessionFilter === 'AM' || sessionFilter === 'AM-PM') {
          sessionHeaders.push({ content: 'AM', colSpan: 2, styles: { halign: 'center', valign: 'middle' } });
        }
        if (sessionFilter === 'PM' || sessionFilter === 'AM-PM') {
          sessionHeaders.push({ content: 'PM', colSpan: 2, styles: { halign: 'center', valign: 'middle' } });
        }
        const sessionsCount = sessionFilter === 'AM-PM' ? 2 : 1;
        for (let i = 0; i < sessionsCount; i++) {
          qtyFatHeaders.push(
            { content: 'Q', styles: { halign: 'center' } },
            { content: 'F', styles: { halign: 'center' } }
          );
        }
      });
      return [headers, sessionHeaders, qtyFatHeaders];
    }

    // Helper to build body for a set of days
    function buildBody(members: MemberData[], days: any[], sessionFilter: string) {
      const body: (string | number)[][] = [];
      members.forEach(member => {
        const row: (string | number)[] = [
          member.custNo.toString(),
          member.name_en
        ];
        days.forEach(dayRecord => {
          const custRecord = dayRecord.quantities.find((q: any) => q.custNo === member.custNo);
          if (custRecord) {
            if (sessionFilter === 'AM' || sessionFilter === 'AM-PM') {
              const qty = custRecord.AM.qty > 0 ? Number(custRecord.AM.qty).toFixed(2) : '';
              const fat = custRecord.AM.fat > 0 ? Number(custRecord.AM.fat).toFixed(1) : '';
              row.push(qty);
              row.push(fat);
            }
            if (sessionFilter === 'PM' || sessionFilter === 'AM-PM') {
              const qty = custRecord.PM.qty > 0 ? Number(custRecord.PM.qty).toFixed(2) : '';
              const fat = custRecord.PM.fat > 0 ? Number(custRecord.PM.fat).toFixed(1) : '';
              row.push(qty);
              row.push(fat);
            }
          } else {
            const emptyCells = sessionFilter === 'AM-PM' ? 4 : 2;
            for (let i = 0; i < emptyCells; i++) {
              row.push('');
            }
          }
        });
        body.push(row);
      });
      return body;
    }

    // Helper to build totals row for a set of days
    function buildTotalsRow(members: MemberData[], days: any[], sessionFilter: string) {
      // For page 2: ["Totals", ...day/session totals..., billed columns]
      const totalsRow: (string | number)[] = [];
      totalsRow.push('Totals');
      // For each day, add totals for qty/fat for each session
      days.forEach(dayRecord => {
        if (sessionFilter === 'AM' || sessionFilter === 'AM-PM') {
          let totalQty = 0;
          dayRecord.quantities.forEach((custRecord: any) => {
            if (custRecord.AM.qty > 0) { totalQty += custRecord.AM.qty; }
          });
          totalsRow.push(totalQty > 0 ? Number(totalQty).toFixed(2) : '');
          totalsRow.push('');
        }
        if (sessionFilter === 'PM' || sessionFilter === 'AM-PM') {
          let totalQty = 0, totalFat = 0, countFat = 0;
          dayRecord.quantities.forEach((custRecord: any) => {
            if (custRecord.PM.qty > 0) { totalQty += custRecord.PM.qty; }
          });
          totalsRow.push(totalQty > 0 ? Number(totalQty).toFixed(2) : '');
          totalsRow.push('');
        }
      });
      // Calculate grand totals for billed columns from ledgerData.custBills
      let totalQty = 0, totalAmount = 0, totalPrevDue = 0, totalPaid = 0, totalDue = 0;
      if (ledgerData && ledgerData.custBills) {
        ledgerData.custBills.forEach((bill: any) => {
          totalQty += bill.totalQty || 0;
          totalAmount += bill.amount || 0;
          totalPrevDue += bill.prevDueAmt || 0;
          totalPaid += bill.paidAmt || 0;
          totalDue += bill.dueAmt || 0;
        });
      }
      totalsRow.push(
        totalQty > 0 ? Number(totalQty).toFixed(2) : '',
        totalAmount > 0 ? totalAmount.toFixed(2) : '',
        totalPrevDue !== 0 ? totalPrevDue.toFixed(2) : '',
        totalPaid > 0 ? totalPaid.toFixed(2) : '',
        totalDue !== 0 ? totalDue.toFixed(2) : ''
      );
      return totalsRow;
    }

    // Page 1: Days 1-5
    const [headers1, sessionHeaders1, qtyFatHeaders1] = buildHeaders(firstHalf, sessionFilter);
    const body1 = buildBody(members, firstHalf, sessionFilter);
    autoTable(doc, {
      head: [headers1, sessionHeaders1, qtyFatHeaders1],
      body: body1,
      startY: 28,
      styles: {
        fontSize: 6,
        cellPadding: 1,
        overflow: 'linebreak',
        halign: 'center',
        minCellHeight: 5,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [176, 196, 222],
        textColor: [50, 50, 50],
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        fontSize: 4,
        minCellHeight: 3,        
        lineColor: [150, 150, 150], // match body
        lineWidth: 0.1 // match body
      },
      alternateRowStyles: {
        fillColor: [240, 245, 255]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', cellWidth: 32 },
        // Q and F columns: reduce width
        2: { cellWidth: 8 },
        3: { cellWidth: 8 },
        4: { cellWidth: 8 },
        5: { cellWidth: 8 },
        6: { cellWidth: 8 },
        7: { cellWidth: 8 },
        8: { cellWidth: 8 },
        9: { cellWidth: 8 }
      },
      margin: { top: 28, left: 5, right: 5 },
      theme: 'grid',
      tableWidth: 'auto'
    });

    // Page 2: Days 6-10 + totals
    doc.addPage('a4', 'portrait');    
    this.pdfUtils.addSubtitle(doc, `Ledger for Billing Period: ${startDate} - ${endDate}`, 20);
    // Custom headers/body for page 2 (no name/village)
    function buildHeadersPage2(days: any[], sessionFilter: string) {
      const headers: any[] = [
        { content: 'No', rowSpan: 3, styles: { halign: 'center', valign: 'middle' } }
      ];      
      const sessionHeaders: any[] = [];
      const qtyFatHeaders: any[] = [];
      days.forEach(dayRecord => {
        const dateDisplay = doc ? dayRecord.day.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '';
        let dateColspan = 0;
        if (sessionFilter === 'AM' || sessionFilter === 'AM-PM') dateColspan += 2;
        if (sessionFilter === 'PM' || sessionFilter === 'AM-PM') dateColspan += 2;
        headers.push({ content: dateDisplay, colSpan: dateColspan, styles: { halign: 'center', valign: 'middle' } });
        if (sessionFilter === 'AM' || sessionFilter === 'AM-PM') {
          sessionHeaders.push({ content: 'AM', colSpan: 2, styles: { halign: 'center', valign: 'middle' } });
        }
        if (sessionFilter === 'PM' || sessionFilter === 'AM-PM') {
          sessionHeaders.push({ content: 'PM', colSpan: 2, styles: { halign: 'center', valign: 'middle' } });
        }
        const sessionsCount = sessionFilter === 'AM-PM' ? 2 : 1;
        for (let i = 0; i < sessionsCount; i++) {
          qtyFatHeaders.push(
            { content: 'Q', styles: { halign: 'center' } },
            { content: 'F', styles: { halign: 'center' } }
          );
        }
      });
      // Add billed column group at the end
      headers.push({ content: 'Billed', colSpan: 5, styles: { halign: 'center', valign: 'middle' } });
      sessionHeaders.push(
        { content: 'Qty', styles: { halign: 'center', valign: 'middle' } },
        { content: 'Amount', styles: { halign: 'center', valign: 'middle' } },
        { content: 'Prev', styles: { halign: 'center', valign: 'middle' } },
        { content: 'Paid', styles: { halign: 'center', valign: 'middle' } },
        { content: 'Due', styles: { halign: 'center', valign: 'middle' } }
      );
      return [headers, sessionHeaders, qtyFatHeaders];
    }

    function buildBodyPage2(members: MemberData[], days: any[], sessionFilter: string) {
      const body: (string | number)[][] = [];
      members.forEach(member => {
        const row: (string | number)[] = [member.custNo.toString()];
        days.forEach(dayRecord => {
          const custRecord = dayRecord.quantities.find((q: any) => q.custNo === member.custNo);
          if (custRecord) {
            if (sessionFilter === 'AM' || sessionFilter === 'AM-PM') {
              const qty = custRecord.AM.qty > 0 ? Number(custRecord.AM.qty).toFixed(2) : '';
              const fat = custRecord.AM.fat > 0 ? Number(custRecord.AM.fat).toFixed(1) : '';
              row.push(qty);
              row.push(fat);
            }
            if (sessionFilter === 'PM' || sessionFilter === 'AM-PM') {
              const qty = custRecord.PM.qty > 0 ? Number(custRecord.PM.qty).toFixed(2) : '';
              const fat = custRecord.PM.fat > 0 ? Number(custRecord.PM.fat).toFixed(1) : '';
              row.push(qty);
              row.push(fat);
            }
          } else {
            const emptyCells = sessionFilter === 'AM-PM' ? 4 : 2;
            for (let i = 0; i < emptyCells; i++) {
              row.push('');
            }
          }
        });
        // Find billed columns from ledgerData.custBills
        let bill = undefined;
        if (ledgerData && ledgerData.custBills) {
          bill = ledgerData.custBills.find((b: any) => b.custNo === member.custNo);
        }
        row.push(
          bill && bill.totalQty > 0 ? Number(bill.totalQty).toFixed(2) : '',
          bill && bill.amount > 0 ? bill.amount.toFixed(2) : '',
          bill && bill.prevDueAmt !== undefined ? bill.prevDueAmt.toFixed(2) : '',
          bill && bill.paidAmt > 0 ? bill.paidAmt.toFixed(2) : '',
          bill && bill.dueAmt !== undefined ? bill.dueAmt.toFixed(2) : ''
        );
        body.push(row);
      });
      return body;
    }

    const [headers2, sessionHeaders2, qtyFatHeaders2] = buildHeadersPage2(secondHalf, sessionFilter);
    const body2 = buildBodyPage2(members, secondHalf, sessionFilter);
    // Add totals row
    const totalsRow = buildTotalsRow(members, secondHalf, sessionFilter);
    body2.push(totalsRow);
    autoTable(doc, {
      head: [headers2, sessionHeaders2, qtyFatHeaders2],
      body: body2,
      startY: 28,
      styles: {
        fontSize: 6,
        cellPadding: 1,
        overflow: 'linebreak',
        halign: 'center',
        minCellHeight: 5,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [176, 196, 222],
        textColor: [50, 50, 50],
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        fontSize: 4,
        minCellHeight: 3,
        lineColor: [150, 150, 150], // match body
        lineWidth: 0.1 // match body
      },
      alternateRowStyles: {
        fillColor: [240, 245, 255]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        // Q and F columns: reduce width
        1: { cellWidth: 8 },
        2: { cellWidth: 8 },
        3: { cellWidth: 8 },
        4: { cellWidth: 8 },
        5: { cellWidth: 8 },
        6: { cellWidth: 8 },
        7: { cellWidth: 8 },
        8: { cellWidth: 8 },
        9: { cellWidth: 8 }
      },
      margin: { top: 28, left: 5, right: 5 },
      theme: 'grid',
      tableWidth: 'auto'
    });

    // Create filename
    const startDateFile = this.pdfUtils.formatDateForFile(ledgerData.tenDayStart);
    const endDateFile = sortedRecords.length > 0 
      ? this.pdfUtils.formatDateForFile(sortedRecords[sortedRecords.length - 1].day)
      : startDateFile;
    const filename = `ledger_${startDateFile}_to_${endDateFile}.pdf`;

    // Save PDF
    this.pdfUtils.downloadPdf(doc, filename);
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
