import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';

/**
 * Shared utilities for PDF generation across the application
 */
@Injectable({
  providedIn: 'root'
})
export class PdfUtilsService {

  /**
   * Format date as YYYY-MM-DD for filenames
   */
  formatDateForFile(date: Date): string {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /**
   * Format date for display as MMM, DD (e.g., Nov, 11)
   */
  formatDateShort(date: Date): string {
    const d = new Date(date);
    const month = d.toLocaleString('en-US', { month: 'short' });
    return `${month}, ${d.getDate()}`;
  }

  /**
   * Format date for display with locale (e.g., "Jan 1, 2025")
   */
  formatDateDisplay(date: Date, locale: string = 'en-US', options?: Intl.DateTimeFormatOptions): string {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };
    return new Date(date).toLocaleDateString(locale, options || defaultOptions);
  }

  /**
   * Add a centered header to PDF document
   */
  addCenteredHeader(doc: jsPDF, title: string, y: number, fontSize: number = 16): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, y, { align: 'center' });
    doc.setFont('helvetica', 'normal'); // Reset to normal
  }

  /**
   * Add a subtitle below header
   */
  addSubtitle(doc: jsPDF, subtitle: string, y: number, fontSize: number = 12): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(fontSize);
    doc.text(subtitle, pageWidth / 2, y, { align: 'center' });
  }

  /**
   * Add customer details section
   */
  addCustomerDetails(doc: jsPDF, customer: {
    name_en: string;
    village: string;
    custNo: number;
  }, startY: number): number {
    doc.setFontSize(11);
    let currentY = startY;
    
    doc.text(`Customer: ${customer.name_en}`, 15, currentY);
    currentY += 7;
    
    doc.text(`Village: ${customer.village}`, 15, currentY);
    currentY += 7;
    
    doc.text(`Customer No: ${customer.custNo}`, 15, currentY);
    currentY += 7;
    
    return currentY; // Return next available Y position
  }

  /**
   * Add billing period line
   */
  addBillingPeriod(doc: jsPDF, startDate: Date, endDate: Date, y: number): number {
    doc.setFontSize(11);
    const periodText = `Period: ${this.formatDateDisplay(startDate)} - ${this.formatDateDisplay(endDate)}`;
    doc.text(periodText, 15, y);
    return y + 7;
  }

  /**
   * Add a payment summary section
   */
  addPaymentSummary(doc: jsPDF, summary: {
    billedAmount: number;
    prevDueAmount: number;
    paidAmount: number;
    dueAmount: number;
  }, startY: number): void {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Summary', 15, startY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    let currentY = startY + 8;
    doc.text(`Billed Amount: ₹${summary.billedAmount.toFixed(2)}`, 15, currentY);
    currentY += 7;
    
    doc.text(`Previous Due: ₹${summary.prevDueAmount.toFixed(2)}`, 15, currentY);
    currentY += 7;
    
    doc.text(`Paid Amount: ₹${summary.paidAmount.toFixed(2)}`, 15, currentY);
    currentY += 7;
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Due Amount: ₹${summary.dueAmount.toFixed(2)}`, 15, currentY);
  }

  /**
   * Convert PDF to blob for sharing
   */
  pdfToBlob(doc: jsPDF): Blob {
    return doc.output('blob');
  }

  /**
   * Create a File object from PDF blob
   */
  createPdfFile(doc: jsPDF, fileName: string): File {
    const blob = this.pdfToBlob(doc);
    return new File([blob], fileName, { type: 'application/pdf' });
  }

  /**
   * Download PDF file
   */
  downloadPdf(doc: jsPDF, fileName: string): void {
    doc.save(fileName);
  }

  /**
   * Generate WhatsApp message for billing
   */
  generateWhatsAppMessage(customer: {
    name_en: string;
  }, period: {
    start: Date;
    end: Date;
  }, summary: {
    totalAmount: number;
    prevDueAmount: number;
    paidAmount: number;
    dueAmount: number;
  }): string {
    const startDate = this.formatDateDisplay(period.start, 'en-US', { month: 'short', day: 'numeric' });
    const endDate = this.formatDateDisplay(period.end, 'en-US', { month: 'short', day: 'numeric' });
    
    return `Dear ${customer.name_en},

Your milk collection billing statement for the period ${startDate} - ${endDate} is attached.

*Summary:*
Total Amount: ₹${summary.totalAmount.toFixed(2)}
Previous Due: ₹${summary.prevDueAmount.toFixed(2)}
Paid: ₹${summary.paidAmount.toFixed(2)}
Due Amount: ₹${summary.dueAmount.toFixed(2)}

Thank you for your business!`;
  }

  /**
   * Format phone number for WhatsApp (add India country code if needed)
   */
  formatPhoneForWhatsApp(mobileNo: string): string {
    let phoneNumber = mobileNo.replace(/\D/g, '');
    if (!phoneNumber.startsWith('91') && phoneNumber.length === 10) {
      phoneNumber = '91' + phoneNumber; // Add India country code
    }
    return phoneNumber;
  }
}
