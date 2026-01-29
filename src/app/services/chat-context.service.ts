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

const NEW_MESSAGE_CHANNEL_ID = 'general';

const INITIAL_STATE: ChatContextState = {
  type: 'new',
  channelId: null,
  convId: null,
};

@Injectable({ providedIn: 'root' })
export class ChatContextService {
  private router = inject(Router);
  private _state = signal<ChatContextState>(INITIAL_STATE);

  readonly contextType = computed(() => this._state().type);
  readonly channelId = computed(() => this._state().channelId);
  readonly convId = computed(() => this._state().convId);

  constructor(
    private conversationService: ConversationService,
    private authService: AuthService
  ) {
    this.updateFromUrl(this.router.url);

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((e) => this.updateFromUrl(e.urlAfterRedirects));
  }

  private updateFromUrl(url: string): void {
    this._state.set(this.parseChatRoute(url));
  }

  private parseChatRoute(url: string): ChatContextState {
    const clean = url.split('?')[0].split('#')[0];
    const [prefix, id] = clean.split('/').filter(Boolean);

    switch (prefix) {
      case 'c': {
        if (id === NEW_MESSAGE_CHANNEL_ID) return this.newState();
        return this.channelState(id);
      }

      case 'dm':
        return this.convState(id);


      default:
        return INITIAL_STATE;
    }
  }

  private channelState(id?: string): ChatContextState {
    return {
      type: 'channel',
      channelId: id ?? null,
      convId: null,
    };
  }

  private convState(id?: string): ChatContextState {
    return {
      type: 'dm',
      channelId: null,
      convId: id ?? null,
    };
  }

  private newState(): ChatContextState {
    return {
      type: 'new',
      channelId: null,
      convId: null,
    };
  }

  openChannel(channelId: string) {
    this.router.navigate(['/c', channelId]);
  }

  async openConversation(userId: string) {
    const activeUser = this.authService.activeUser();
    if (!activeUser?.uid) {
      return;
    }

    const convId = await this.conversationService.getOrCreateConversationId(
      activeUser.uid,
      userId
    );
    this._state.set({ type: 'dm', channelId: null, convId });
    await this.router.navigate(['/dm', convId]);
  }

  async openConversationByConvId(convId: string) {
    await this.router.navigate(['/dm', convId]);
  }

  openNewMessage() {
    this.router.navigate(['/c', NEW_MESSAGE_CHANNEL_ID]);
  }
}
