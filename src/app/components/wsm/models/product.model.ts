export class Product {
  name: string;
  q?: number | null;
  p?: number | null;
  n?: number | null;
  d?: number | null;
  seq?: number;
  group?: string;
  type?: number;
  subType?: number;
  displaySeq?: number;

  constructor(init?: Partial<Product>) {
    this.name = '';
    if (init) Object.assign(this, init);
  }
}

