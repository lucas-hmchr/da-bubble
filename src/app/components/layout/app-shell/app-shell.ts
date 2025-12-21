import { Component, effect, HostListener, inject, signal } from '@angular/core';
import { Topbar } from '../topbar/topbar';
import { View } from '../view/view';
import { WorkspaceSidebar } from '../workspace-sidebar/workspace-sidebar';
import { ThreadMenu } from '../thread-menu/thread-menu';
import { AuthService } from '../../../auth/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export type MobileView = 'sidebar' | 'chat' | 'thread';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [Topbar, View, WorkspaceSidebar, ThreadMenu, MatIconModule, MatButtonModule],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})


export class AppShell {
  currentUserUid: string | null = null;
  isNewMessageMode = signal(false);
  activeMobileView = signal<MobileView>('sidebar');
  private authService = inject(AuthService);
  isMobile = signal(window.innerWidth < 1024);

  constructor() {
    effect(() => {
      const active = this.authService.activeUser();
      console.log('activeUser in AppShell:', active);
      this.currentUserUid = active?.uid ?? null;
    });
    window.addEventListener('resize', () => {
      this.isMobile.set(window.innerWidth < 1024);
    });
  }

  openNewMessage() {
    // Mobile: erst auf Chat wechseln
    if (this.isMobile()) {
      this.activeMobileView.set('chat');
    }

    // hier sagen wir später dem View:
    // "zeige neue Nachricht"
    this.isNewMessageMode.set(true);

  }

  closeNewMessage() {
    this.isNewMessageMode.set(false);
  }

}
