import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { RateCard, RateItem } from '../model/rate-card.model';
import { RateCardService } from '../../../services/rate-card.service';

@Component({
  selector: 'app-rate-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    TableModule,
  ],
  templateUrl: './rate-card-view.html',
  styleUrl: './rate-card-view.scss',
})
export class RateCardView implements OnInit {
  rateCard = signal<RateCard | null>(null);
  rateItems = signal<RateItem[]>([]);

  constructor(private rateCardService: RateCardService) {}

  ngOnInit(): void {
    // Load rate card data for current billing period
    const currentDate = new Date();
    this.rateCardService.getPayRate(currentDate).subscribe(rateCard => {
      this.rateCard.set(rateCard);
      this.rateItems.set(rateCard.items);
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}
