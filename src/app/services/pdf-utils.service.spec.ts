import { TestBed } from '@angular/core/testing';
import { jsPDF } from 'jspdf';
import { PdfUtilsService } from './pdf-utils.service';

describe('PdfUtilsService', () => {
  let service: PdfUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdfUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Date Formatting', () => {
    it('should format date for file names (YYYY-MM-DD)', () => {
      const date = new Date('2025-01-15');
      expect(service.formatDateForFile(date)).toBe('2025-01-15');
    });

    it('should format date short (MM/DD)', () => {
      const date = new Date('2025-01-05');
      expect(service.formatDateShort(date)).toBe('01/05');
    });

    it('should format date for display with locale', () => {
      const date = new Date('2025-01-15');
      const formatted = service.formatDateDisplay(date);
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
    });
  });

  describe('Phone Formatting', () => {
    it('should add India country code for 10-digit numbers', () => {
      expect(service.formatPhoneForWhatsApp('9876543210')).toBe('919876543210');
    });

    it('should not add country code if already present', () => {
      expect(service.formatPhoneForWhatsApp('919876543210')).toBe('919876543210');
    });

    it('should remove non-digit characters', () => {
      expect(service.formatPhoneForWhatsApp('98-765-43210')).toBe('919876543210');
    });
  });

  describe('PDF Operations', () => {
    let doc: jsPDF;

    beforeEach(() => {
      doc = new jsPDF();
    });

    it('should add centered header', () => {
      const spy = spyOn(doc, 'text');
      service.addCenteredHeader(doc, 'Test Header', 15);
      expect(spy).toHaveBeenCalled();
    });

    it('should add customer details and return next Y position', () => {
      const customer = {
        name_en: 'John Doe',
        village: 'Test Village',
        custNo: 123
      };
      const nextY = service.addCustomerDetails(doc, customer, 20);
      expect(nextY).toBeGreaterThan(20);
    });

    it('should convert PDF to blob', () => {
      const blob = service.pdfToBlob(doc);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
    });

    it('should create PDF file', () => {
      const file = service.createPdfFile(doc, 'test.pdf');
      expect(file).toBeInstanceOf(File);
      expect(file.name).toBe('test.pdf');
      expect(file.type).toBe('application/pdf');
    });
  });

  describe('WhatsApp Message Generation', () => {
    it('should generate properly formatted message', () => {
      const message = service.generateWhatsAppMessage(
        { name_en: 'John Doe' },
        { 
          start: new Date('2025-01-01'), 
          end: new Date('2025-01-10') 
        },
        {
          totalAmount: 1000,
          prevDueAmount: 200,
          paidAmount: 500,
          dueAmount: 700
        }
      );

      expect(message).toContain('John Doe');
      expect(message).toContain('₹1000.00');
      expect(message).toContain('₹200.00');
      expect(message).toContain('₹500.00');
      expect(message).toContain('₹700.00');
    });
  });
});
