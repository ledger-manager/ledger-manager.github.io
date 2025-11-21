import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WsmHomeComponent } from './home.component';

const routes: Routes = [
  { path: '', component: WsmHomeComponent },
  { path: 'home', component: WsmHomeComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WsmRoutingModule {}
