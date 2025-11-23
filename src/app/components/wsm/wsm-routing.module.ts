import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { R1ReportComponent } from './r1-report/r1-report.component';
import { DaySalesReportComponent } from './day-sales-report/day-sales-report.component';
import { ReceiptEntryComponent } from './receipt-entry/receipt-entry.component';
import { StockEntryComponent } from './stock-entry/stock-entry.component';
import { PriceListComponent } from './price-list/price-list.component';
// import { WsmHomeComponent } from './home.component';

const routes: Routes = [
  { path: 'prices', component: PriceListComponent },
  { path: 'stock-entry', component: StockEntryComponent },
  { path: 'receipt-entry', component: ReceiptEntryComponent },
  { path: 'day-sales', component: DaySalesReportComponent },
  { path: 'r1-report', component: R1ReportComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  // Add all WSM components to module scope
  // (standalone components can be imported directly if needed)
  exports: [RouterModule]
})
export class WsmRoutingModule {}
