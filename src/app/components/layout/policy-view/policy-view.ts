import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-policy-view',
  imports: [FormsModule, RouterLink],
  templateUrl: './policy-view.html',
  styleUrl: './policy-view.scss',
})
export class PolicyView {
  private router = inject(Router);
  private authService = inject(AuthService);

  email = '';
  password = '';

  showEmailLoginError: boolean = false;

  async submitLogin() {
    const loginSuccess = await this.authService.login(this.email, this.password);
    this.showEmailLoginError = loginSuccess ? false : this.resetLoginForm();
  }

  triggerGoogleLogin() {
    this.authService.signInWithGoogle();
  }

  continueAsGuest() {
    this.authService.loginAsGuest();
  }

  resetLoginForm() {
    this.password = '';
    this.email = '';
    return true;
  }
}
