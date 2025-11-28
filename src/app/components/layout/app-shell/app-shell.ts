import { Component, effect, signal } from '@angular/core';
import { Topbar } from "../topbar/topbar";
import { View } from '../view/view';
import { WorkspaceSidebar } from '../workspace-sidebar/workspace-sidebar';
import { AuthService } from '../../../auth/auth.service';
import { FirestoreService } from '../../../services/firestore';
import { Avatar } from '../../../models/user.model';
import { ThreadMenu } from '../thread-menu/thread-menu';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [Topbar, View, WorkspaceSidebar, ThreadMenu],
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
