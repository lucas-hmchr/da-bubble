import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from "@angular/router";
import { avatars, defaultAvatar } from './../../../../../shared/data/avatars';
import type { Avatar, NewUser } from './../../../../models/user.model';

@Component({
  selector: 'app-register-form',
  imports: [FormsModule],
  templateUrl: './register-form.html',
  styleUrl: './register-form.scss',
})


export class RegisterForm {

  private router = inject(Router);

  avatarList = avatars;
  defaultAvatar = defaultAvatar;

  fullName = '';
  email = '';
  password = '';
  acceptPP = false;
  showRegistrationFirstStep = true;

  selectedAvatar = signal<Avatar>(this.defaultAvatar)

  get newUser(): NewUser {
    return {
      fullName: this.fullName,
      email: this.email,
      password: this.password,
      selectedAvatarId: this.selectedAvatar().id,
    };
  }

  avatarUrl(avatar: string) {
    return `/images/avatars/${avatar}.svg`
  }

  continueRegistration() {
    this.showRegistrationFirstStep = false;
  }

  submitRegistration() {
    const payload = this.newUser;
    console.log(payload)
  }

  selectAvatar(avatar: Avatar) {
    this.selectedAvatar.set(avatar);
  }

  stepBack() {
    this.showRegistrationFirstStep ? this.router.navigate(['/auth']) : this.showRegistrationFirstStep = true;
    console.log(this.newUser)
  }
}
