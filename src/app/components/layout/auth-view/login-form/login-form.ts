import { Component, computed, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-login-form',
  imports: [FormsModule],
  templateUrl: './login-form.html',
  styleUrl: './login-form.scss',
})
export class LoginForm {

  email = '';
  password = '';

  onSubmit() {
    console.log(this.email, this.password)
  }

}
