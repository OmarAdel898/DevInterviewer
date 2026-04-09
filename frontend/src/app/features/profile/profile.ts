import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth-service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  private fb = inject(FormBuilder);
  protected authService = inject(AuthService);

  protected readonly availableThemes = [
    'light',
    'dark',
    'cupcake',
    'bumblebee',
    'emerald',
    'corporate',
    'synthwave',
    'retro',
    'cyberpunk',
    'valentine',
    'halloween',
    'garden',
    'forest',
    'aqua',
    'lofi',
    'pastel',
    'fantasy',
    'wireframe',
    'black',
    'luxury',
    'dracula',
    'cmyk',
    'autumn',
    'business',
    'acid',
    'lemonade',
    'night',
    'coffee',
    'winter',
    'dim',
    'nord',
    'sunset'
  ];

  protected isSaving = signal(false);
  protected successMessage = signal<string | null>(null);
  protected errorMessage = signal<string | null>(null);

  protected profileForm = this.fb.group({
    fullName: [this.authService.currentUser()?.fullName || '', [Validators.required, Validators.minLength(3)]],
    theme: [this.authService.currentTheme(), [Validators.required]]
  });

  protected saveProfile(): void {
    if (this.profileForm.invalid) {
      this.errorMessage.set('Please enter a valid name.');
      return;
    }

    const fullName = (this.profileForm.value.fullName || '').trim();
    const theme = this.profileForm.value.theme || this.authService.currentTheme();

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService.updateProfile({ fullName }).subscribe({
      next: () => {
        this.authService.setTheme(theme);
        this.successMessage.set('Profile updated successfully.');
        this.isSaving.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Failed to update profile.');
        this.isSaving.set(false);
      }
    });
  }

  protected onThemeChange(event: Event): void {
    const input = event.target as HTMLSelectElement;
    const nextTheme = input.value;

    this.profileForm.patchValue({ theme: nextTheme });
    this.authService.setTheme(nextTheme);
  }
}
