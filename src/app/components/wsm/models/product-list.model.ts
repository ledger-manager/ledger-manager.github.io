import { Product } from './product.model';
import { ItemType } from './stock-payload.model';

export class ProductList {
  products: Product[] = [];

  constructor(items?: Partial<Product>[]) {
    if (items) {
      this.products = items.map(i => new Product(i));
    }
  }

  add(product: Product) {
    this.products.push(product);
  }

  getAll(): Product[] {
    return this.products;
  }
}

export interface ProductPrice {
  effDate: string;
  itemType: ItemType;
  products: Product[];
  saleAmt: number;
  stockAmt: number;
}
