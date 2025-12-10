import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { Channel } from '../../../models/channel.interface';
import { User } from '../../../models/user.model';
import { MessageData } from '../../../models/message.interface';

import { Message } from '../../shared/message/message';
import { MessageInput } from '../../shared/message-input/message-input';

import { UserService } from '../../../services/user.service';
import {
  ChannelSelectionService,
  ViewMode,
} from '../../../services/channel-selection.service';
import { MessageService } from '../../../services/message.service';
import { UserStoreService } from '../../../services/user-store.service';
import { ChannelStoreService } from '../../../services/channel-store.service';

import { getAvatarById } from '../../../../shared/data/avatars';
import { Observable, of } from 'rxjs';

type RecipientType = 'channel' | 'user' | 'email';

interface RecipientSuggestion {
  type: RecipientType;
  id: string;
  label: string;
  detail?: string;
}

@Component({
  selector: 'app-view',
  standalone: true,
  imports: [CommonModule, Message, MessageInput],
  templateUrl: './view.html',
  styleUrl: './view.scss',
})
export class View implements OnInit, OnChanges {
  /**
   * Optional: kann vom Parent gesetzt werden.
   * Wenn nicht gesetzt, wird der aktive Channel aus dem ChannelSelectionService benutzt.
   */
  @Input() channel: Channel | null = null;
  @Input() currentUserUid: string | null = null;

  // DM / Conversations
  private _selectedDmUserOverride: User | null = null;
  @Input() set selectedDmUser(value: User | null) {
    // Falls ein Parent explizit einen User übergibt, bevorzugen wir diesen
    this._selectedDmUserOverride = value;
  }
  @Input() currentConversationId?: string;

  messages$: Observable<MessageData[]> = of([]);

  // Editier-Status für Nachrichten
  editingMessage?: { id: string; text: string };

  // Neue Nachricht (ViewMode 'newMessage')
  recipientInputValue = '';
  showRecipientSuggestions = false;
  recipientSuggestions: RecipientSuggestion[] = [];
  selectedRecipient: RecipientSuggestion | null = null;

  readonly userService = inject(UserService);
  private channelSelection = inject(ChannelSelectionService);
  private messageService = inject(MessageService);
  private userStore = inject(UserStoreService);
  private channelStore = inject(ChannelStoreService);

  get viewMode(): ViewMode {
    return this.channelSelection.mode();
  }

  // Users aus zentralem Store
  get users(): User[] {
    return this.userStore.users();
  }

  // Channels aus zentralem Store
  private get channels(): Channel[] {
    return this.channelStore.channels();
  }

  /**
   * Aktuell aktiver Channel:
   * - bevorzugt @Input() channel (falls Parent explizit einen setzt)
   * - sonst Channel aus ChannelSelectionService + ChannelStore
   */
  get currentChannel(): Channel | null {
    if (this.channel) return this.channel;

    const activeId = this.channelSelection.activeChannelId();
    if (!activeId) return null;

    return this.channelStore.getById(activeId) ?? null;
  }

  /**
   * Aktueller DM-User:
   * - bevorzugt expliziter @Input() selectedDmUser (z. B. wenn Parent bindet)
   * - sonst über activeDmUserId + UserStore aufgelöst
   */
  get selectedDmUserResolved(): User | null {
    if (this._selectedDmUserOverride) return this._selectedDmUserOverride;

    const dmId = this.channelSelection.activeDmUserId();
    if (!dmId) return null;

    return this.users.find((u) => u.uid === dmId) ?? null;
  }

  // Mitglieder des aktuellen Channels (aus Channel.members + UserStore)
  get channelMembers(): User[] {
    const ch = this.currentChannel;
    if (!ch) return [];

    const memberIds = (ch.members ?? []) as string[];
    if (!memberIds.length) return [];

    const users = this.users;
    return users.filter(
      (u) => !!u.uid && memberIds.includes(u.uid)
    );
  }

  get isCurrentUserMember(): boolean {
    const ch = this.currentChannel;
    if (!ch || !this.currentUserUid) return false;

    const memberIds = (ch.members ?? []) as string[];
    return memberIds.includes(this.currentUserUid);
  }

  get isChannelCreatedToday(): boolean {
    const ch = this.currentChannel;
    if (!ch || !ch.createdAt) return false;

    const created = this.toDate(ch.createdAt);
    if (!created) return false;

    const now = new Date();
    return (
      created.getFullYear() === now.getFullYear() &&
      created.getMonth() === now.getMonth() &&
      created.getDate() === now.getDate()
    );
  }

  constructor() {
    // Reagiere auf Änderungen an Modus oder aktiver ID
    effect(() => {
      const _mode = this.channelSelection.mode();
      const _activeChannelId = this.channelSelection.activeChannelId();
      const _activeDmId = this.channelSelection.activeDmUserId();
      void _mode;
      void _activeChannelId;
      void _activeDmId;
      this.updateMessagesStream();
    });
  }

  ngOnInit(): void {
    this.updateMessagesStream();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['channel']) {
      this.updateMessagesStream();
    }
  }

  private updateMessagesStream() {
    if (this.viewMode === 'channel') {
      const ch = this.currentChannel;
      if (ch?.id) {
        this.messages$ = this.messageService.watchChannelMessages(ch.id);
      } else {
        this.messages$ = of([]);
      }
      return;
    }

    if (this.viewMode === 'dm' && this.currentConversationId) {
      this.messages$ = this.messageService.watchConversationMessages(
        this.currentConversationId
      );
      return;
    }

    // newMessage oder kein Kontext
    this.messages$ = of([]);
  }

  // --- Helper: Datums-Konvertierung ---

  private toDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'number') return new Date(value);
    if (typeof value === 'string') return new Date(value);
    if (value.toDate) return value.toDate(); // Firestore Timestamp
    return null;
  }

  // --- Header / Avatare ---

  getAvatarSrc(user: User | null | undefined): string {
    if (!user) {
      return '/images/avatars/avatar_default.svg';
    }
    const avatar = getAvatarById(user.avatarId);
    return avatar.src;
  }

  // --- Editier-Logik für Nachrichten ---

  onEditRequested(msg: MessageData) {
    if (!msg.id) return;
    this.editingMessage = { id: msg.id, text: msg.text };
  }

  onEditFinished() {
    this.editingMessage = undefined;
  }

  // --- Neue Nachricht (ViewMode: 'newMessage') ---

  onRecipientInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.recipientInputValue = value;

    const term = value.trim();
    if (!term) {
      this.showRecipientSuggestions = false;
      this.recipientSuggestions = [];
      this.selectedRecipient = null;
      return;
    }

    const suggestions: RecipientSuggestion[] = [];

    if (term.startsWith('#')) {
      const q = term.slice(1).toLowerCase();
      this.channels
        .filter((c) => (c.name ?? '').toLowerCase().includes(q))
        .forEach((c) =>
          suggestions.push({
            type: 'channel',
            id: c.id ?? '',
            label: c.name,
            detail: 'Channel',
          })
        );
    } else if (term.startsWith('@')) {
      const q = term.slice(1).toLowerCase();
      this.users
        .filter((u) =>
          (u.displayName ?? u.name ?? '').toLowerCase().includes(q)
        )
        .forEach((u) =>
          suggestions.push({
            type: 'user',
            id: u.uid ?? '',
            label: u.displayName ?? u.name,
            detail: u.email,
          })
        );
    } else if (term.includes('@')) {
      suggestions.push({
        type: 'email',
        id: term,
        label: term,
        detail: 'E-Mail',
      });
    } else {
      const q = term.toLowerCase();
      this.channels
        .filter((c) => (c.name ?? '').toLowerCase().includes(q))
        .forEach((c) =>
          suggestions.push({
            type: 'channel',
            id: c.id ?? '',
            label: c.name,
            detail: 'Channel',
          })
        );

      this.users
        .filter((u) =>
          (u.displayName ?? u.name ?? '').toLowerCase().includes(q)
        )
        .forEach((u) =>
          suggestions.push({
            type: 'user',
            id: u.uid ?? '',
            label: u.displayName ?? u.name,
            detail: u.email,
          })
        );
    }

    this.recipientSuggestions = suggestions;
    this.showRecipientSuggestions = suggestions.length > 0;
  }

  onSelectRecipient(s: RecipientSuggestion) {
    this.selectedRecipient = s;
    this.showRecipientSuggestions = false;

    if (s.type === 'channel') {
      this.recipientInputValue = `#${s.label}`;
    } else if (s.type === 'user') {
      this.recipientInputValue = `@${s.label}`;
    } else {
      this.recipientInputValue = s.label;
    }
  }

  getSelectedRecipientChannel(): Channel | undefined {
    if (!this.selectedRecipient || this.selectedRecipient.type !== 'channel') {
      return undefined;
    }
    return this.channels.find((c) => c.id === this.selectedRecipient!.id);
  }

  onNewMessageSent(event: {
    contextType: 'channel' | 'conversation';
    channelId?: string;
    conversationId?: string;
  }) {
    this.recipientInputValue = '';
    this.selectedRecipient = null;
    this.recipientSuggestions = [];
    this.showRecipientSuggestions = false;

    if (event.contextType === 'channel' && event.channelId) {
      this.channelSelection.setActiveChannelId(event.channelId);
    }
  }
}
