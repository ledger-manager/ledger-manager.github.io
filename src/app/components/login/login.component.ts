import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CouchdbService } from '../../services/couchdb.service';
import { AuthService } from '../../services/auth.service';
import { CookieConsentComponent } from '../mcm/cookie-consent/cookie-consent.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CardModule,
    ToastModule,
    CookieConsentComponent
  ],
  providers: [MessageService],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username = signal('');
  password = signal('');
  loading = signal(false);

  constructor(
    private couchdbService: CouchdbService,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {
    // If already logged in, redirect to home
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }

  login(): void {
    const username = this.username();
    const password = this.password();

    if (!username || !password) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please enter username and password',
        life: 3000
      });
      return;
    }

    this.loading.set(true);

    this.couchdbService.login(username, password).subscribe({
      next: (session) => {
        this.loading.set(false);
        if (session.ok && session.name) {
          // Store session info, including password for local basic auth
          this.authService.setSession(session, password);


          this.messageService.add({
            severity: 'success',
            summary: 'Login Successful',
            detail: `Welcome ${session.name}!`,
            life: 3000
          });

          // Redirect after short delay to show success message
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 1000);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Login Failed',
            detail: 'Invalid credentials',
            life: 3000
          });
        }
      },
      error: (error) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Login Failed',
          detail: error.error?.reason || 'Unable to connect to server',
          life: 3000
        });
      }
    });
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.login();
    }
  }
}
