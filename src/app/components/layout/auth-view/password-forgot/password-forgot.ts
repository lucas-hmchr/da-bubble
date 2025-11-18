import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from "@angular/router";
import { AuthService } from '../../../../auth/auth.service';

@Component({
  selector: 'app-password-forgot',
  imports: [FormsModule, RouterLink],
  templateUrl: './password-forgot.html',
  styleUrl: './password-forgot.scss',
})
export class PasswordForgot {

  private authService = inject(AuthService);

  email: string = '';

  loading = signal(false);
  errorMessage = signal<null | string>(null);

  async sendMail() {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const result = await this.authService.resetPassword(this.email);
    } catch (err) {
      this.errorMessage.set('Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.');
    } finally {
      this.loading.set(false);
    }
  }
}
