import { Routes } from '@angular/router';
import { AppShell } from './components/layout/app-shell/app-shell';
import { redirectUnauthorizedTo, redirectLoggedInTo, canActivate } from '@angular/fire/auth-guard';
import { environment } from '../environments/environment';
import { PolicyView } from './components/layout/policy-view/policy-view';
import { View } from './components/layout/view/view';

const redirectUnauthorizedToAuth = () => redirectUnauthorizedTo(['auth']);
const redirectLoggedInToApp = () => redirectLoggedInTo(['']);


const guardsEnabled = environment.enableRouteGuards;
const guardIfEnabled = (pipe: any) => (guardsEnabled ? canActivate(pipe) : {});

export const routes: Routes = [
  {
    path: '',
    component: AppShell,
    ...guardIfEnabled(redirectUnauthorizedToAuth),
    children: [
      { path: '', redirectTo: 'c/general', pathMatch: 'full' },
      { path: 'c/:channelId', component: View },
      { path: 'dm/:conversationId', component: View },
      // { path: 'new', component: NewMessageViewComponent },
    ]
  },
  {
    path: 'auth', loadChildren: () =>
      import('./auth/auth.routes').then(m => m.AUTH_ROUTES), ...guardIfEnabled(redirectLoggedInToApp)
  },
  { path: 'impressum', component: PolicyView },
  { path: 'datenschutz', component: PolicyView },

];
