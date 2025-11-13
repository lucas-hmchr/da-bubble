import { Component, computed } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-password-reset',
  imports: [FormsModule, RouterLink],
  templateUrl: './password-reset.html',
  styleUrl: './password-reset.scss',
})
export class PasswordReset {
  newPassword = '';
  newPasswordRepeat = '';

  get pwIdentical(): boolean {
    return (
      this.newPassword !== '' &&
      this.newPasswordRepeat !== '' &&
      this.newPassword === this.newPasswordRepeat
    )
  }

  updatePw() {

  }
}
