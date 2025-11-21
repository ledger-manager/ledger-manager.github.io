import { NgModule } from '@angular/core';
import { McmRoutingModule } from './mcm-routing.module';

import { authGuard } from '../../guards/auth.guard';

@NgModule({
  imports: [McmRoutingModule], 
  exports: []
})
export class McmModule {}
