import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from "@angular/router";
import { AuthService } from '../../../../auth/auth.service';

@Component({
  selector: 'app-login-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './login-form.html',
  styleUrl: './login-form.scss',
})
export class LoginForm {

  private router = inject(Router);
  private authService = inject(AuthService);

  email = '';
  password = '';

  submitLogin() {
    this.authService.login(this.email, this.password)
  }

  triggerGoogleLogin() {
    this.authService.signInWithGoogle();
  }

  continueAsGuest() {
    try {
      this.authService.loginAsGuest();
    } catch (err) {
      console.error(err);
    } 
  }
}
