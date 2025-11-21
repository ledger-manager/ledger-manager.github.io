export interface RateItem {
  effectiveDate: Date;
  payRate: number;
}

export interface RateCard {
  items: RateItem[];
}

