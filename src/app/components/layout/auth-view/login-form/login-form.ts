import { Component, computed, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-login-form',
  imports: [FormsModule, RouterLink],
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
