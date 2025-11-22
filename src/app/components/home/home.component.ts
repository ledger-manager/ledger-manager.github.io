import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class AppHomeComponent {
  constructor(private router: Router, private authService: AuthService) {}

  get canAccessMCM(): boolean {
    const roles = this.authService.getUserRoles();
    return this.authService.isAdmin() || roles.includes('mcm_member');
  }

  goTo(path: string) {
    this.router.navigate([`/${path}`]);
  }

  logout() {
    this.authService.logout();
  }
}
