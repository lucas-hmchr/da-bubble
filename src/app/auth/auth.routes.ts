import { Routes } from '@angular/router';
import { AuthView } from '../components/layout/auth-view/auth-view';
import { LoginForm } from '../components/layout/auth-view/login-form/login-form';
import { RegisterForm } from '../components/layout/auth-view/register-form/register-form';
import { PasswordForgot } from '../components/layout/auth-view/password-forgot/password-forgot';
import { PasswordReset } from '../components/layout/auth-view/password-reset/password-reset';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: AuthView,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: LoginForm, title: 'Login' },
      { path: 'register', component: RegisterForm, title: 'Registrieren' },
      { path: 'password-forgot', component: PasswordForgot, title: 'Passwort vergessen' },
      { path: 'password-reset', component: PasswordReset, title: 'Passwort zurücksetzen' },
    ]
  }
];
