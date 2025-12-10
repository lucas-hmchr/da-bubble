import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { Channel } from '../../../models/channel.interface';
import { User } from '../../../models/user.model';
import { MessageData } from '../../../models/message.interface';

import { Message } from '../../shared/message/message';
import { MessageInput } from '../../shared/message-input/message-input';

import { UserService } from '../../../services/user.service';
import { ChannelSelectionService, ViewMode } from '../../../services/channel-selection.service';
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
  @Input() channel: Channel | null = null;
  @Input() channelMembers: User[] = [];
  @Input() currentUserUid: string | null = null;

  @Input() selectedDmUser: User | null = null;
  @Input() currentConversationId?: string;

  messages$: Observable<MessageData[]> = of([]);

  editingMessage?: { id: string; text: string };

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

  get users(): User[] {
    return this.userStore.users();
  }

  private get channels(): Channel[] {
    return this.channelStore.channels();
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
    if (this.channel?.id) {
      this.messages$ = this.messageService.watchChannelMessages(this.channel.id);
    } else {
      this.messages$ = of([]);
    }
  }


  getAvatarSrc(user: User): string {
    const avatar = getAvatarById(user.avatarId);
    return avatar.src;
  }


  onEditRequested(msg: MessageData) {
    if (!msg.id) return;
    this.editingMessage = { id: msg.id, text: msg.text };
  }

  onEditFinished() {
    this.editingMessage = undefined;
  }


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
