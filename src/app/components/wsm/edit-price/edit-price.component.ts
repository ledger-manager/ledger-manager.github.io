import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductPrice } from '../models/product-list.model';
import { Product } from '../models/product.model';
import { Subscription, combineLatest } from 'rxjs';
import { AppStateService } from '../services/app-state.service';
import { ProductPriceService } from '../services/product-price.service';
import { ItemBinLookupService } from '../services/item-bin-lookup.service';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-price',
  templateUrl: './edit-price.component.html',
  standalone: true,
  imports: [ReactiveFormsModule]
})
export class EditPriceComponent implements OnInit, OnDestroy {
    save(): void {
      // TODO: Implement save logic
      this.savedMessage = 'Prices saved successfully.';
    }
  form: FormGroup;
  savedMessage: string | null = null;
  private msgTimer: any = null;
  selectedDate: string | null = null;
  private sub: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private appState: AppStateService,
    private productService: ProductPriceService,
    private itemBinService: ItemBinLookupService
  ) {
    this.form = this.fb.group({ rows: this.fb.array([]) });
  }

  ngOnInit(): void {
    this.sub = this.productService.getPrice().subscribe((priceList: ProductPrice | null) => {
      this.selectedDate = priceList?.effDate ? new Date(priceList.effDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')).toISOString().split('T')[0] : null;
      const products: Product[] = priceList?.products ?? [];
      const rows = this.form.get('rows') as FormArray;
      rows.clear();
      products.sort((a: Product, b: Product) => (a.seq ?? 0) - (b.seq ?? 0)).forEach((p: Product) => {
        rows.push(this.createRowForProduct(p));
      });
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  createRowForProduct(p: Product): FormGroup {
    return this.fb.group({
      seq: [p.seq],
      name: [p.name],
      group: [p.group],
      type: [p.type],
      subType: [p.subType],
      q: [p.q, [Validators.min(0)]],
      p: [p.p, [Validators.min(0)]],
      n: [p.n, [Validators.min(0)]],
      d: [p.d, [Validators.min(0)]]
    });
  }

  get rows(): FormArray {
    return this.form.get('rows') as FormArray;
  }
}
