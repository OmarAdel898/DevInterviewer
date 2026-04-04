import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
    },
    {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
    },
    {
        path: 'dashboard',
        canActivate: [roleGuard(['admin', 'interviewer'])],
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
    },
    {
        path: 'my-interviews',
        canActivate: [roleGuard(['user'])],
        loadComponent: () => import('./features/home/home').then((m) => m.Home),
    },
    { path: 'interview/:id',canActivate: [roleGuard(['admin', 'interviewer', 'user'])], loadComponent: () => import('./features/interview-room/interview-room').then((m) => m.InterviewRoom)},
    { path: '**', redirectTo: 'login' },
];
