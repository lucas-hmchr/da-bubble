import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from "@angular/router";


type Avatar = { id: number; name: string };

type NewUser = {
  fullName: string;
  email: string;
  password: string;
  selectedAvatarId: number;
};


@Component({
  selector: 'app-register-form',
  imports: [FormsModule],
  templateUrl: './register-form.html',
  styleUrl: './register-form.scss',
})


export class RegisterForm {

  private router = inject(Router);

  fullName = '';
  email = '';
  password = '';
  acceptPP = false;
  showRegistrationFirstStep = true;

  selectedAvatar = signal<Avatar>({
    id: 1,
    name: "avatar_default"
  })

  get newUser(): NewUser {
    return {
      fullName: this.fullName,
      email: this.email,
      password: this.password,
      selectedAvatarId: this.selectedAvatar().id,
    };
  }

  // Avatar liste global positionieren, sodass nur id weitergegeben werden muss
  avatars = [
    { id: 2, name: "avatar_female_1" },
    { id: 3, name: "avatar_female_2" },
    { id: 4, name: "avatar_male_1" },
    { id: 5, name: "avatar_male_2" },
    { id: 6, name: "avatar_male_3" },
    { id: 7, name: "avatar_male_4" }
  ]


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
