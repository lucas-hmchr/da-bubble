import { Component, computed, inject } from '@angular/core';
import { ProfilePopupService } from './../../../services/profile-popup.service';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-profile-popup',
  imports: [],
  templateUrl: './profile-popup.html',
  styleUrl: './profile-popup.scss',
})

export class ProfilePopup {
  popup = inject(ProfilePopupService);
  userService = inject(UserService);
  isOpen = computed(() => this.popup.isOpen());
  uid = computed(() => this.popup.uid());
  

  close() {
    this.popup.close();
  }
}
