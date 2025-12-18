import { Injectable, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConversationService } from './conversation.service';
import { AuthService } from '../auth/auth.service';
import { user } from '@angular/fire/auth';

export type ChatContextType = 'channel' | 'dm' | 'new';

interface ChatContextState {
  type: ChatContextType;
  channelId: string | null;
  convId: string | null;
}

const INITIAL_STATE: ChatContextState = {
  type: 'new',
  channelId: null,
  convId: null,
};

@Injectable({ providedIn: 'root' })
export class ChatContextService {
  private router = inject(Router);
  private conversationService = inject(ConversationService);
  private authService = inject(AuthService);

  private _state = signal<ChatContextState>(INITIAL_STATE);

  // Public, read-only API
  readonly contextType = computed(() => this._state().type);
  readonly channelId = computed(() => this._state().channelId);
  readonly convId = computed(() => this._state().convId);

  constructor() {
    // Initial sync (wichtig für "URL im neuen Tab einfügen")
    this.syncFromUrl(this.router.url);

    // Sync bei Navigation (wichtig für router.navigate)
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => this.syncFromUrl(this.router.url));
  }

  private syncFromUrl(url: string) {
    const clean = url.split('?')[0].split('#')[0];
    const parts = clean.split('/').filter(Boolean); // z.B. ["dm", "abc"] oder ["c","devteam"]

    if (parts[0] === 'dm' && parts[1]) {
      this._state.set({ type: 'dm', channelId: null, convId: parts[1] });
      return;
    }

    if (parts[0] === 'c' && parts[1]) {
      // bei euch gilt: /c/general == newMessage
      if (parts[1] === 'general') {
        this._state.set({ type: 'new', channelId: null, convId: null });
      } else {
        this._state.set({ type: 'channel', channelId: parts[1], convId: null });
      }
      return;
    }

    // Fallback: new
    this._state.set({ type: 'new', channelId: null, convId: null });
  }

  openChannel(channelId: string) {
    this._state.set({ type: 'channel', channelId, convId: null });
    this.router.navigate(['/c', channelId]);
  }

  async openConversation(userId: string) {
    const activeUser = this.authService.activeUser();
    if (!activeUser?.uid) {
      console.warn('No active user – cannot open DM');
      return;
    }

    const convId = await this.conversationService.getOrCreateConversationId(
      activeUser.uid,
      userId
    );
    // wichtig: State setzen + navigieren
    this._state.set({ type: 'dm', channelId: null, convId });
    await this.router.navigate(['/dm', convId]);
  }

  async openConversationByConvId(convId: string) {
    // wichtig: State setzen + navigieren
    this._state.set({ type: 'dm', channelId: null, convId });
    await this.router.navigate(['/dm', convId]);
  }

  openNewMessage() {
    // bei euch ist "new" = /c/general
    this._state.set({ type: 'new', channelId: null, convId: null });
    this.router.navigate(['/c', 'general']);
  }
}
