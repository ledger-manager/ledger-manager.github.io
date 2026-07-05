export class Product {
  name: string;
  q?: any;
  p?: any;
  n?: any;
  d?: any;
  seq?: number;
  item_id?: number;
  group?: string;
  type?: number;
  subType?: number;
  displaySeq?: number;
  active?: boolean;

  constructor(init?: Partial<Product>) {
    this.name = '';
    if (init) Object.assign(this, init);
  }
}

