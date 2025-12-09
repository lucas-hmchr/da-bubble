import { Component, effect, signal } from '@angular/core';
import { Topbar } from "../topbar/topbar";
import { View } from '../view/view';
import { WorkspaceSidebar } from '../workspace-sidebar/workspace-sidebar';
import { AuthService } from '../../../auth/auth.service';
import { FirestoreService } from '../../../services/firestore';
import { User } from '../../../models/user.model';
import { ThreadMenu } from '../thread-menu/thread-menu';
import { Channel } from '../../../models/channel.interface';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [Topbar, View, WorkspaceSidebar, ThreadMenu],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {
  users: User[] = [];
  usersJson = '';
  currentUserUid: string | null = null;
  activeChannel = signal<Channel | null>(null);

  constructor(
    private authService: AuthService,
    private firestoreService: FirestoreService,
  ) {
    effect(() => {
      const active = this.authService.activeUser();
      console.log('activeUser in AppShell:', active);

      this.currentUserUid = active?.uid ?? null;
    });

    this.firestoreService.getCollection<User>('users').subscribe((users) => {
      this.users = users;
      this.usersJson = JSON.stringify(users);
      console.log('users in AppShell:', this.users);
    });
  }
}
