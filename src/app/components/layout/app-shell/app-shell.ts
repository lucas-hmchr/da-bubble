import { Component, effect } from '@angular/core';
import { Topbar } from "../topbar/topbar";
import { View } from '../view/view';
import { AuthService } from '../../../auth/auth.service';
import { FirestoreService } from '../../../services/firestore';
import { Avatar } from '../../../models/user.model';

@Component({
  selector: 'app-app-shell',
  imports: [Topbar, View],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {
  users: Avatar[] = [];
  usersJson = '';

  constructor(
    private authService: AuthService,
    private firestoreService: FirestoreService,
  ) {
    effect(() => {
      console.log('activeUser in AppShell:', this.authService.activeUser());
    });

    this.firestoreService.getCollection<Avatar>('users').subscribe((users) => {
      this.users = users;
      this.usersJson = JSON.stringify(users);
      console.log('users in AppShell:', this.users);
    });
  }
}
