import { Routes } from '@angular/router';
import { AppShell } from './components/layout/app-shell/app-shell';
import { AuthView } from './components/layout/auth-view/auth-view';

export const routes: Routes = [
    { path: '', component: AppShell },
    { path: 'auth', component: AuthView },
];
