import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { tap } from 'rxjs/internal/operators/tap';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://127.0.0.1:3000/auth';

  currentUser = signal<User | null>(null);

  constructor() {
    const user = localStorage.getItem('user');
    if (user) {
      this.currentUser.set(JSON.parse(user));
    }
  }

  login(payload: any) {
    return this.http.post<{ success: boolean, accessToken: string, user: User }>(`${this.apiUrl}/login`, payload)
      .pipe(
        tap((response) => {
          this.setSession(response.accessToken, response.user);
        })
      );
  }

  private setSession(token: string, user: User) {
    localStorage.setItem('accessToken', token); // Save the JWT
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUser.set(user);
  }
  register(payload: any) {
    return this.http.post(`${this.apiUrl}/register`, payload);
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getUserByEmail(email:string){
    return this.http.post<{ success: boolean, user: User }>(`${this.apiUrl}/user`,{email});
  }
}
