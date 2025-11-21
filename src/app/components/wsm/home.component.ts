import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-wsm-home',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <div class="wsm-home-container">
      <h1>WSM Home</h1>
      <p>Welcome to the WSM module landing page.</p>
      <p-button label="Logout" icon="pi pi-sign-out" [style]="{background:'#c62828', 'margin-top':'2rem'}" (onClick)="logout()"></p-button>
    </div>
  `,
  styles: [`
    .wsm-home-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    h1 {
      color: #1976d2;
      margin-bottom: 1rem;
    }
    p {
      font-size: 1.2rem;
      color: #333;
    }
  `]
})
export class WsmHomeComponent {
  constructor(private authService: AuthService) {}

  logout() {
    this.authService.logout();
  }
}
