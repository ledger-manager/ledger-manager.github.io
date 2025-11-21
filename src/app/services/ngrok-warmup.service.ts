import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NgrokWarmupService {
  private isWarmedUp = false;

  constructor(private http: HttpClient) {}

  /**
   * Pre-warm the Ngrok tunnel by making a GET request
   * This bypasses the Ngrok browser warning page
   * Call this early in app initialization
   */
  warmupTunnel(): Promise<void> {
    if (this.isWarmedUp) {
      return Promise.resolve();
    }

    // Only warm up if using external URL (contains https and ngrok)
    if (!environment.BASE_URL.includes('https') || !environment.BASE_URL.includes('ngrok')) {
      this.isWarmedUp = true;
      return Promise.resolve();
    }

    // ...existing code...

    return new Promise((resolve) => {
      // Make requests to multiple endpoints to warm up the tunnel
      const warmupUrls = [
        `${environment.BASE_URL}/_session`,
        `${environment.BASE_URL}/${environment.DB_NAME}/MCM_CUSTOMERS`
      ];

      // Make a simple GET request to warm up the tunnel
      this.http.get(warmupUrls[0], {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json'
        }
      }).pipe(
        tap((response) => {
          // ...existing code...
          this.isWarmedUp = true;
        }),
        catchError(error => {
          // ...existing code...
          // Mark as warmed even if error, as it hit the endpoint
          this.isWarmedUp = true;
          return of(null);
        })
      ).subscribe(() => resolve());
    });
  }

  /**
   * Check if the tunnel has been warmed up
   */
  isReady(): boolean {
    return this.isWarmedUp;
  }
}
