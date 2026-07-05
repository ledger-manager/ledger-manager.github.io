import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppStateService } from './app-state.service';
import { ItemBinLookupService, ItemLookupBin } from './item-bin-lookup.service';
import { ProductPrice } from '../models/product-list.model';
import { CouchDataService } from './couch-data.service';

@Injectable({
  providedIn: 'root'
})
export class ProductPriceService {
  getPrice(): Observable<ProductPrice | null> {
    return this.couchData.getPrice();
  }

  constructor(
    private lookupService: ItemBinLookupService,
    private appState: AppStateService,
    private couchData: CouchDataService
  ) { }

  // ...existing code...
}
