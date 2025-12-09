import { Component, effect, inject } from '@angular/core';
import { Topbar } from '../topbar/topbar';
import { View } from '../view/view';
import { WorkspaceSidebar } from '../workspace-sidebar/workspace-sidebar';
import { ThreadMenu } from '../thread-menu/thread-menu';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [Topbar, View, WorkspaceSidebar, ThreadMenu],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {
  currentUserUid: string | null = null;

  private authService = inject(AuthService);

  constructor() {
    // Auth-Signal beobachten und UID ableiten
    effect(() => {
      const active = this.authService.activeUser();
      console.log('activeUser in AppShell:', active);
      this.currentUserUid = active?.uid ?? null;
    });
  }
}
