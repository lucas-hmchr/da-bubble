import { Routes } from '@angular/router';
import { AppShell } from './components/layout/app-shell/app-shell';

export const routes: Routes = [
    { path: '', component: AppShell },
    { path: 'auth',  loadChildren: () =>
      import('./auth/auth.routes').then(m => m.AUTH_ROUTES) },
];
