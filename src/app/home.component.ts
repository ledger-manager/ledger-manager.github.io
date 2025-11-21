import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <div class="app-home-container">
      <h1>Ledger Manager</h1>
      <div class="app-home-buttons">
        <button (click)="goTo('mcm')">MC Manager</button>
        <button (click)="goTo('wsm')">WSM</button>
        <button (click)="logout()" style="background:#c62828; margin-left:2rem;">Logout</button>
      </div>
    </div>
  `,
  styles: [`
    .app-home-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    .app-home-buttons {
      display: flex;
      gap: 2rem;
      margin-top: 2rem;
    }
    button {
      padding: 1rem 2rem;
      font-size: 1.2rem;
      border-radius: 8px;
      border: none;
      background: #1976d2;
      color: #fff;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover {
      background: #1565c0;
    }
  `]
})
export class AppHomeComponent {
  constructor(private router: Router, private authService: AuthService) {}

  goTo(path: string) {
    this.router.navigate([`/${path}`]);
  }

  logout() {
    this.authService.logout();
  }
}
