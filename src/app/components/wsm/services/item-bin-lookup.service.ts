import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, switchMap, take, map, of, filter, combineLatest } from 'rxjs';
import { AppStateService } from './app-state.service';
import { environment } from '../../../../environments/environment';
import { ItemType } from '../models/stock-payload.model';
import { LookupType } from '../models/item-lookup.model';

export interface ItemLookupBin {
  itemType: ItemType;
  location: string;
  items: Record<string, string>;
}

@Injectable({
  providedIn: 'root'
})
export class ItemBinLookupService {

  private readonly apiUrl = environment.JSON_BIN_API_URL;

  constructor(
    private appState: AppStateService,
    private http: HttpClient
  ) {
    // ...existing code...
  }

  // ...existing code...
}
