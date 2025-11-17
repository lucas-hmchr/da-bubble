import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-password-forgot',
  imports: [FormsModule, RouterLink],
  templateUrl: './password-forgot.html',
  styleUrl: './password-forgot.scss',
})
export class PasswordForgot {

  email: string = '';

  sendMail() {

  }
}
