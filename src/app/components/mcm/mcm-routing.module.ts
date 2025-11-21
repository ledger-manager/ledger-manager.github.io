import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Home } from './home/home';
import { RateCardView } from './rate-card-view/rate-card-view';
import { CustomerView } from './customer-view/customer-view';
import { LedgerEntry } from './ledger-entry/ledger-entry';
import { PaymentReport } from './payment-report/payment-report';
import { RateCardComponent } from './rate-card-edit/rate-card-edit';
import { UserPassbook } from './user-passbook/user-passbook';
import { authGuard } from '../../guards/auth.guard';

const routes: Routes = [
  { path: '', component: Home },
  { path: 'rate-card', component: RateCardView },
  { path: 'customers', component: CustomerView },
  { path: 'ledger-entry', component: LedgerEntry },
  { path: 'payment-report', component: PaymentReport },
  { path: 'rate-card-edit', component: RateCardComponent },
  { path: 'user-passbook', component: UserPassbook },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class McmRoutingModule {}
