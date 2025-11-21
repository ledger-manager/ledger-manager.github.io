import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cookie-consent-overlay" *ngIf="show">
      <div class="cookie-consent-box">
        <h3>Cookie Consent</h3>
        <p>
          This app uses cookies for authentication and API access. Please accept cookies to continue using all features.
        </p>
        <button (click)="accept()">Accept & Continue</button>
      </div>
    </div>
  `,
  styles: [`
    .cookie-consent-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cookie-consent-box {
      background: #fff;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.2);
      text-align: center;
      max-width: 350px;
    }
    button {
      margin-top: 1rem;
      padding: 0.5rem 1.5rem;
      font-size: 1rem;
      border: none;
      border-radius: 4px;
      background: #1976d2;
      color: #fff;
      cursor: pointer;
    }
    button:hover {
      background: #1565c0;
    }
  `]
})
export class CookieConsentComponent {
  show = false;

  constructor() {
    this.show = !localStorage.getItem('cookieConsent');
  }

  accept() {
    localStorage.setItem('cookieConsent', 'true');
    this.show = false;
  }
}
