export interface StockVal {
  seq: number;
  qqty?: number | null;
  pqty?: number | null;
  nqty?: number | null;
  dqty?: number | null;
}

export function createEmptyStockVal(seq: number): StockVal {
  return { seq, qqty: null, pqty: null, nqty: null, dqty: null };
}

