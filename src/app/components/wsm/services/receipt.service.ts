import { Injectable } from '@angular/core';
import { Observable, switchMap, take } from 'rxjs';
import { ItemBinLookupService } from './item-bin-lookup.service';
import { StockVal } from '../models/stock-val.model';
import { AppStateService } from './app-state.service';
import { ItemType, StockPayload } from '../models/stock-payload.model';

@Injectable({
  providedIn: 'root'
})
export class ReceiptService {

  constructor(
    private lookupService: ItemBinLookupService,
    private appState: AppStateService
  ) { }

  // ...existing code...
}
