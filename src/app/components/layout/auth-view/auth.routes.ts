import { Routes } from '@angular/router';
import { AuthView } from './auth-view';
import { LoginForm } from './login-form/login-form';
import { RegisterForm } from './register-form/register-form';
import { PasswordForgot } from './password-forgot/password-forgot';
import { PasswordReset } from './password-reset/password-reset';

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
