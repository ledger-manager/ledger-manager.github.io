import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductPrice } from '../models/product-list.model';
import { Product } from '../models/product.model';
import { Subscription, combineLatest, take } from 'rxjs';
import { AppStateService } from '../services/app-state.service';
import { ProductPriceService } from '../services/product-price.service';
import { ItemBinLookupService } from '../services/item-bin-lookup.service';
import { CouchDataService } from '../services/couch-data.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-edit-price',
  templateUrl: './edit-price.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, CommonModule]
})
export class EditPriceComponent implements OnInit, OnDestroy {
    save(): void {
      if (this.savedMessage) {
        // prevent double-saving while a message is visible
      }

      const rows = this.form.get('rows') as FormArray;
      const products = rows.controls.map(g => ({
        seq: g.get('seq')?.value,
        name: g.get('name')?.value,
        group: g.get('group')?.value,
        type: g.get('type')?.value,
        subType: g.get('subType')?.value,
        q: g.get('q')?.value ?? null,
        p: g.get('p')?.value ?? null,
        n: g.get('n')?.value ?? null,
        d: g.get('d')?.value ?? null
      } as Product));

      const effDate = this.selectedDate ? this.selectedDate.replace(/-/g, '') : '';
      const payload: ProductPrice = { effDate, itemType: 'products', products, saleAmt: 0, stockAmt: 0 };

      this.couchData.savePrice(payload).pipe(take(1)).subscribe(ok => {
        this.savedMessage = ok ? 'Prices saved successfully.' : 'Failed to save prices.';
        if (this.msgTimer) clearTimeout(this.msgTimer);
        this.msgTimer = setTimeout(() => this.savedMessage = null, 3000);
      }, () => this.savedMessage = 'Failed to save prices.');
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
    private itemBinService: ItemBinLookupService,
    private couchData: CouchDataService
  ) {
    this.form = this.fb.group({ rows: this.fb.array([]) });
  }

  ngOnInit(): void {
    this.sub = this.productService.getPrice().subscribe((priceList: ProductPrice | null) => {
      if (priceList?.effDate) {
        const iso = priceList.effDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
        const d = new Date(iso);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        this.selectedDate = `${yyyy}-${mm}-${dd}`;
      } else {
        this.selectedDate = null;
      }
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
