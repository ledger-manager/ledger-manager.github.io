import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {

  constructor() { }

  exportTable(title: string, headers: string[], rows: (string | number | null)[][]): void {
    try {
      const doc = new jsPDF();
      doc.setFontSize(12);
      doc.text(title, 14, 20);
      autoTable(doc, {
        startY: 26,
        head: [headers],
        body: rows
      });
      doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      // graceful fallback: no-op if PDF generation fails in this environment
      console.error('PDF export failed', e);
    }
  }

  // ...existing code...
}
