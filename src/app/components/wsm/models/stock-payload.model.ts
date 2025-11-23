import { StockVal } from './stock-val.model';

export type ItemType = 'stock' | 'receipt' | 'products' | 'price-lkp' | 'stock-lkp';

export interface StockPayload {
  dateId: string;
  itemType: ItemType;
  values: StockVal[];
  saleAmt: number;
  stockAmt: number;
}
