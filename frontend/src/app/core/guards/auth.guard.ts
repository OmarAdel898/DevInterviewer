import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    const user = authService.currentUser(); 

    if (!user) {
      return router.createUrlTree(['/login']);
    }

    const hasRole = allowedRoles.includes(user.role);
    
    if (!hasRole) {
      const redirectPath = user.role === 'user' ? '/my-interviews' : '/dashboard';
      return router.createUrlTree([redirectPath]);
    }

    return true;
  };
};
