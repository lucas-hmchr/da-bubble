import { Routes } from '@angular/router';
import { AppShell } from './components/layout/app-shell/app-shell';
import { redirectUnauthorizedTo, redirectLoggedInTo, canActivate } from '@angular/fire/auth-guard';
import { environment } from '../environments/environment';

const redirectUnauthorizedToAuth = () => redirectUnauthorizedTo(['auth']);
const redirectLoggedInToApp = () => redirectLoggedInTo(['']);


const guardsEnabled = environment.enableRouteGuards;
const guardIfEnabled = (pipe: any) => (guardsEnabled ? canActivate(pipe) : {});

export const routes: Routes = [
  { path: '', component: AppShell, ...guardIfEnabled(redirectUnauthorizedToAuth)},
  {
    path: 'auth', loadChildren: () =>
      import('./auth/auth.routes').then(m => m.AUTH_ROUTES), ...guardIfEnabled(redirectLoggedInToApp)},
];
