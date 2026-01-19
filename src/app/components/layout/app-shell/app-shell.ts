import { Component, effect, inject, signal, computed } from '@angular/core';
import { fromEvent } from 'rxjs';
import { debounceTime, throttleTime } from 'rxjs/operators';
import { Topbar } from '../topbar/topbar';

import { WorkspaceSidebar } from '../workspace-sidebar/workspace-sidebar';
import { ThreadMenu } from '../thread-menu/thread-menu';
import { AuthService } from '../../../auth/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ChatContextService } from '../../../services/chat-context.service';
import { View } from '../view/view';
import { ThreadService } from '../../../services/thread.service';

export type MobileView = 'sidebar' | 'new-message' | 'chat' | 'thread';


@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [Topbar, WorkspaceSidebar, ThreadMenu, MatIconModule, MatButtonModule, View],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})


export class AppShell {
  currentUserUid: string | null = null;
  isNewMessageMode = signal(false);
  activeMobileView = signal<MobileView>('sidebar');
  private authService = inject(AuthService);
  public threadService = inject(ThreadService);
  isMobile = signal(window.innerWidth < 1024);
  windowWidth = signal(window.innerWidth);

  // Track Workspace Sidebar Status (Drawer opened/closed)
  isWorkspaceOpen = signal(true);

  constructor(private chatContext: ChatContextService) {
    effect(() => {
      const active = this.authService.activeUser();
      console.log('activeUser in AppShell:', active);
      this.currentUserUid = active?.uid ?? null;
    });

    // Window Resize Listener
    // fromEvent(window, 'resize')
    //   .pipe(debounceTime(150))
    //   .subscribe(() => {
    //     const width = window.innerWidth;
    //     this.windowWidth.set(width);
    //     this.isMobile.set(width < 1024);
    //   });
    fromEvent(window, 'resize')
      .pipe(
        throttleTime(16, undefined, { leading: true, trailing: true })  // ~60fps
      )
      .subscribe(() => {
        const width = window.innerWidth;
        this.windowWidth.set(width);
        this.isMobile.set(width < 1024);
      });

    effect(() => {
      // Wenn sich der Chat-Context ändert, Thread schließen
      const channelId = this.chatContext.channelId();
      const convId = this.chatContext.convId();

      // Bei Navigation zu neuem Channel/DM → Thread schließen
      this.threadService.close();
    });
  }

  // ========== COMPUTED: VIEW SICHTBARKEIT ==========
  shouldShowView = computed(() => {
    const width = this.windowWidth();
    const threadOpen = this.threadService.isOpen();
    const mobile = this.isMobile();
    const mobileView = this.activeMobileView();
    const workspaceOpen = this.isWorkspaceOpen();

    // Mobile: Bestehende Logik
    if (mobile) {
      return mobileView === 'chat' || mobileView === 'new-message';
    }

    // Tablet Range (1024-1300px)
    if (width >= 1024 && width < 1300) {
      // Wenn Workspace geschlossen: View immer zeigen
      if (!workspaceOpen) {
        return true;
      }

      // Wenn Workspace offen UND Thread offen: View verstecken
      if (workspaceOpen && threadOpen) {
        return false;
      }

      return true;
    }

    // Desktop (> 1300px): Immer anzeigen
    return true;
  });
  // ========== END COMPUTED ==========

  // Workspace Toggle Handler
  onWorkspaceToggle(isOpen: boolean) {
    this.isWorkspaceOpen.set(isOpen);
  }

  openNewMessage() {
    this.isNewMessageMode.set(true);
    this.chatContext.openNewMessage();

    if (this.isMobile()) {
      this.activeMobileView.set('new-message');
    }
  }

  openThread() {
    if (this.isMobile()) {
      this.activeMobileView.set('thread');
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
      // Thread schließen
      this.threadService.close();
      this.activeMobileView.set('chat');
      return;
    }

    // new-message ODER chat → zurück zur sidebar
    this.isNewMessageMode.set(false);
    this.activeMobileView.set('sidebar');
  }

  onOpenThread() {
    if (this.isMobile()) {
      this.activeMobileView.set('thread');
    }
  }

}