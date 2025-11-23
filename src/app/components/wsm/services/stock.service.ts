import { Injectable } from '@angular/core';
import { Observable, switchMap, take, of, map } from 'rxjs';
import { ItemType, StockPayload } from '../models/stock-payload.model';
import { ItemBinLookupService } from './item-bin-lookup.service';
import { AppStateService } from './app-state.service';

@Injectable({
  providedIn: 'root'
})
export class StockService {

  constructor(
    private lookupService: ItemBinLookupService,
    private appState: AppStateService
  ) { }

  // ...existing code...
}
