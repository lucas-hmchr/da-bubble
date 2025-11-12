import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-register-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './register-form.html',
  styleUrl: './register-form.scss',
})
export class RegisterForm {

  fullName = '';
  email = '';
  password = '';
  acceptPP = false;
  showRegistrationFirstStep = true;

  avatars = [
    "avatar_female_1",
    "avatar_female_2",
    "avatar_male_1",
    "avatar_male_2",
    "avatar_male_3",
    "avatar_male_4"
  ]

  avatarUrl(avatar: string) {
    return `/images/avatars/${avatar}.svg`
  }

  continueRegistration() {
    this.showRegistrationFirstStep = false;
  }

  submitRegistration() {

  }
}
