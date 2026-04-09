import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth-service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  authService = inject(AuthService);

  get dashboardRoute(): string {
    const role = this.authService.currentUser()?.role;
    return role === 'user' ? '/my-interviews' : '/dashboard';
  }

  logout() {
    this.authService.logout();
  }
}
