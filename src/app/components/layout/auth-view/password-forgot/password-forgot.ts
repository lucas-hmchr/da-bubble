import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from "@angular/router";
import { MessageInput } from '../../../shared/message-input/message-input';

@Component({
  selector: 'app-password-forgot',
  imports: [FormsModule, RouterLink, MessageInput],
  templateUrl: './password-forgot.html',
  styleUrl: './password-forgot.scss',
})
export class PasswordForgot {

  email: string = '';

  sendMail() {

  }
}
