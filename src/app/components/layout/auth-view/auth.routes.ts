import { Routes } from '@angular/router';
import { AuthView } from './auth-view';
import { LoginForm } from './login-form/login-form';
import { RegisterForm } from './register-form/register-form';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: AuthView,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: LoginForm, title: 'Login' },
      { path: 'register', component: RegisterForm, title: 'Registrieren' },
    ]
  }
];
