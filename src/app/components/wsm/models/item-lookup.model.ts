export type LookupType = 'stock-lkp' | 'receipt-lkp' | 'price-lkp';

export interface ItemLookupBin {
  itemType: LookupType;
  location: string;
  items:  Record<string, string>;
}
