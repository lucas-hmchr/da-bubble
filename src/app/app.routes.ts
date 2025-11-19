import { Routes } from '@angular/router';
import { AppShell } from './components/layout/app-shell/app-shell';
import { redirectUnauthorizedTo, redirectLoggedInTo, canActivate } from '@angular/fire/auth-guard';

const redirectUnauthorizedToAuth = () => redirectUnauthorizedTo(['auth']);
const redirectLoggedInToApp  = () => redirectLoggedInTo(['']);

export const routes: Routes = [
    { path: '', component: AppShell, ...canActivate(redirectUnauthorizedToAuth), },
    { path: 'auth',  loadChildren: () =>
      import('./auth/auth.routes').then(m => m.AUTH_ROUTES), ...canActivate(redirectLoggedInToApp), },
];
