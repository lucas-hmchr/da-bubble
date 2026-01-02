import { Component, effect, HostListener, inject, signal } from '@angular/core';
import { Topbar } from '../topbar/topbar';
import { View } from '../view/view';
import { WorkspaceSidebar } from '../workspace-sidebar/workspace-sidebar';
import { ThreadMenu } from '../thread-menu/thread-menu';
import { AuthService } from '../../../auth/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ChatContextService } from '../../../services/chat-context.service';

export type MobileView = 'sidebar' | 'new-message' | 'chat' | 'thread';


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

  constructor(private chatContext: ChatContextService,) {
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
    this.isNewMessageMode.set(true);
    this.chatContext.openNewMessage();

    if (this.isMobile()) {
      this.activeMobileView.set('new-message');
    }
  }


  closeNewMessage() {
    this.isNewMessageMode.set(false);

    if (this.isMobile()) {
      this.activeMobileView.set('sidebar');
    }
  }

  backOneLevel() {
    const view = this.activeMobileView();

    if (view === 'thread') {
      this.activeMobileView.set('chat');
      return;
    }

    // new-message ODER chat → zurück zur sidebar
    this.isNewMessageMode.set(false);
    this.activeMobileView.set('sidebar');
  }



}
