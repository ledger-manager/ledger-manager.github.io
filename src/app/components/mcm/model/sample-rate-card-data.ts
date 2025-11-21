import { RateCard } from './rate-card.model';

/**
 * Generate mock rate card data
 */
export function generateMockRateCard(): RateCard {
  return {
    items: [
      {
        effectiveDate: new Date(2025, 0, 1), // January 1st, 2025
        payRate: 8.00
      }
    ]
  };
}
