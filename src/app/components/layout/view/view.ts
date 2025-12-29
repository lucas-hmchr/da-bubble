<<<<<<< HEAD
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

=======
import { Component, Input, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FirestoreService } from '../../../services/firestore';
import { MessageInput } from '../../shared/message-input/message-input';
import { Message } from '../../shared/message/message';
>>>>>>> ee3eec266c2dc6cde20db4744cb51b7e99ed4fea
import { Channel } from '../../../models/channel.interface';
import { User } from '../../../models/user.model';
<<<<<<< HEAD
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
=======
import { UserService } from '../../../services/user.service';
import { ChatContextService, ChatContextType } from '../../../services/chat-context.service';
import { ChannelService } from '../../../services/channel.service';
import { ConversationService } from '../../../services/conversation.service';
import { NewMessageService } from '../../../services/new-message.service';
import { ViewStateService } from '../../../services/view-state.service';
import { ProfilePopup } from "../../shared/profile-popup/profile-popup";
import { ProfilePopupService } from '../../../services/profile-popup.service';
import { AddMemberPopup } from "./add-member-popup/add-member-popup";
>>>>>>> ee3eec266c2dc6cde20db4744cb51b7e99ed4fea

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
<<<<<<< HEAD
  imports: [CommonModule, Message, MessageInput],
=======
  imports: [CommonModule, MessageInput, Message, ProfilePopup, AddMemberPopup],
>>>>>>> ee3eec266c2dc6cde20db4744cb51b7e99ed4fea
  templateUrl: './view.html',
  styleUrl: './view.scss',
})
<<<<<<< HEAD
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
=======
export class View {
  public newMessage = inject(NewMessageService);
  public viewState = inject(ViewStateService);
  @Input() currentUserUid: string | null = null;
  contextType: ChatContextType = 'channel';
  editingMessage: { id: string; text: string } | null = null;
>>>>>>> ee3eec266c2dc6cde20db4744cb51b7e99ed4fea

  // Neue Nachricht (ViewMode 'newMessage')
  recipientInputValue = '';
  showRecipientSuggestions = false;
  recipientSuggestions: RecipientSuggestion[] = [];
  selectedRecipient: RecipientSuggestion | null = null;
  showChannelMemberList = signal<Boolean>(false);
  showAddChannelMemberPopup = signal<Boolean>(false);

<<<<<<< HEAD
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
=======
  constructor(
    private firestore: FirestoreService,
    private channelService: ChannelService,
    private conversationService: ConversationService,
    private chatContext: ChatContextService,
    public userService: UserService,
    private profilePopupService: ProfilePopupService,
  ) {
    console.log('Neu Nachricht: s',this.newMessage);

    effect(() => {
      const type = this.chatContext.contextType();
      const channelId = this.chatContext.channelId();
      const convId = this.chatContext.convId();
      this.showChannelMemberList.set(false);

      this.contextType = type;

      if (type === 'channel' && channelId) {
        this.channelService.subscribeSelectedChannel(channelId);
        this.conversationService.cleanup();
        this.resetNewMessageState();
      } else if (type === 'dm' && convId) {
        this.conversationService.subscribeToConversation(convId);
        this.resetNewMessageState();
      } else if (type === 'new') {
        this.conversationService.cleanup();
        this.channelService.cleanUp();
        this.resetNewMessageState();
      }
    });
  }

  get channel(): Channel | null {
    return this.channelService.activeChannel();
  }

  get channelMessages(): MessageData[] {
    return this.channelService.activeChannelMessages();
  }

  get channelMembers(): User[] {
    return this.channelService.channelMembers();
  }

  get allChannels(): Channel[] {
    return this.channelService.channels();
  }

  get allUsers(): User[] {
    return this.firestore.userList();
  }

  get dmMessages(): MessageData[] {
    return this.conversationService.activeConversationMessages();
  }

  get dmPartner(): User | null {
    return this.conversationService.activeConversationPartner();
  }

  get dmConversationId(): string | null {
    return this.conversationService.activeConversationId();
  }

  get isChannelEmpty(): boolean {
    return this.channelService.isActiveChannelEmpty();
  }

  dmLoaded(): boolean {
    return this.conversationService.dmLoaded();
>>>>>>> ee3eec266c2dc6cde20db4744cb51b7e99ed4fea
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

<<<<<<< HEAD
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
=======
  private resetNewMessageState() {
    this.recipientInputValue = '';
    this.recipientSuggestions = [];
    this.showRecipientSuggestions = false;
    this.selectedRecipient = null;
  }

  onNewMessageSent(evt: {
    contextType: 'channel' | 'conversation';
    channelId?: string;
    conversationId?: string;
  }) {
    if (evt.contextType === 'channel' && evt.channelId) {
      this.chatContext.openChannel(evt.channelId);
    }

    if (evt.contextType === 'conversation' && evt.conversationId) {
      this.chatContext.openConversation(evt.conversationId);
    }
  }

  getSelectedRecipientChannel(): Channel | undefined {
    if (!this.selectedRecipient || this.selectedRecipient.type !== 'channel') {
      return undefined;
    }
    return this.allChannels.find(c => c.id === this.selectedRecipient!.id);
  }

  onEditRequested(msg: MessageData) {
    if (!msg.id) return;
    this.editingMessage = { id: msg.id, text: msg.text };
  }

  onEditFinished() {
    this.editingMessage = null;
  }

  onNewMessageToKeyup(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    this.newMessage.setQuery(input.value);
  }

  toggleChannelMemberList() {
    this.showChannelMemberList.set(!this.showChannelMemberList());
  }

  openProfile(uid: string) {
    this.profilePopupService.open(uid);
  }

  toggleAddChannelMemberPopup() {
    this.showAddChannelMemberPopup.set(!this.showAddChannelMemberPopup())
  }

  openAddingPopupFromMemberList() {
    this.showChannelMemberList.set(false);
    this.showAddChannelMemberPopup.set(true);
  }
>>>>>>> ee3eec266c2dc6cde20db4744cb51b7e99ed4fea
}
