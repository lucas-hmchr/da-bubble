import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from "@angular/router";
import { avatars, getAvatarById, Avatar, AvatarId } from './../../../../../shared/data/avatars';
import type { User, NewUser } from './../../../../models/user.model';
import { AuthService } from '../../../../auth/auth.service';


@Component({
  selector: 'app-register-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './register-form.html',
  styleUrl: './register-form.scss',
})


export class RegisterForm {

  private router = inject(Router);
  private authService = inject(AuthService);

  avatarList = avatars.filter(a => a.id !== 'avatar_default');
  defaultAvatar = getAvatarById('avatar_default');

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
      avatarId: this.selectedAvatar().id,
    };
  }

  getAvatarUrl(avatarId: AvatarId) {
    return getAvatarById(avatarId).src;
  }

  continueRegistration() {
    this.showRegistrationFirstStep = false;
  }

  async submitRegistration() {
    try {
      await this.authService.register(this.newUser.email, this.newUser.password, this.newUser.fullName, this.newUser.avatarId);
    } catch (err: any) {
      console.error(err);
    }
  }

  selectAvatar(avatar: Avatar) {
    this.selectedAvatar.set(avatar);
  }

  stepBack() {
    this.showRegistrationFirstStep ? this.router.navigate(['/auth']) : this.showRegistrationFirstStep = true;
  }
}
