import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from "@angular/router";
import { avatars, defaultAvatar } from './../../../../../shared/data/avatars';
import type { Avatar, NewUser } from './../../../../models/user.model';
import { AuthService } from '../../../../auth/auth.service';

@Component({
  selector: 'app-register-form',
  imports: [FormsModule],
  templateUrl: './register-form.html',
  styleUrl: './register-form.scss',
})


export class RegisterForm {

  private router = inject(Router);
  private authService = inject(AuthService);

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
      selectedAvatarName: this.selectedAvatar().name,
    };
  }

  avatarUrl(avatar: string) {
    return `/images/avatars/${avatar}.svg`
  }

  continueRegistration() {
    this.showRegistrationFirstStep = false;
  }

  async submitRegistration() {
    try {
      await this.authService.register(this.newUser.email, this.newUser.password, this.newUser.fullName, this.newUser.selectedAvatarName);
    } catch (err: any) {
      console.log(err)
    }
  }

  selectAvatar(avatar: Avatar) {
    this.selectedAvatar.set(avatar);
  }

  stepBack() {
    this.showRegistrationFirstStep ? this.router.navigate(['/auth']) : this.showRegistrationFirstStep = true;
  }
}
